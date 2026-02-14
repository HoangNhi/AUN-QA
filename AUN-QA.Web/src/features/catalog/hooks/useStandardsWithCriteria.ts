import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Standard,
  Criterion,
  CriterionRequirement,
} from "@/features/catalog/types/standard.types";
import { standardService } from "@/features/catalog/api/standard.api";

// --- Helpers ---

export const getRequirementSummary = (
  requirements?: CriterionRequirement[],
) => {
  if (!requirements || requirements.length === 0) {
    return { isMandatory: false, minQuantity: 0 };
  }

  return {
    isMandatory: requirements.some((req) => req.IsMandatory),
    minQuantity: Math.max(...requirements.map((req) => req.MinQuantity || 0)),
  };
};

export type CriterionStatus = "satisfied" | "partial" | "empty";
export type FilterMode = "all" | "satisfied" | "partial" | "empty";

/** Determine criterion status based on requirements data */
export const getCriterionStatus = (criterion: Criterion): CriterionStatus => {
  const reqs = criterion.CriterionRequirements;
  if (!reqs || reqs.length === 0) return "empty";

  const totalRequired = reqs.reduce((sum, r) => sum + (r.MinQuantity || 0), 0);
  if (totalRequired === 0) return "empty";

  // Without evidence count data, we use requirement presence as proxy:
  // "satisfied" = has requirements defined (all accounted for)
  // For now, all criteria with requirements are "partial" since we can't verify evidence count
  const mandatoryCount = reqs.filter((r) => r.IsMandatory).length;
  if (mandatoryCount === 0) return "satisfied";
  return "partial";
};

/** Determine standard status based on its criteria */
export const getStandardStatus = (standard: Standard): CriterionStatus => {
  const criteria = standard.Criterions || [];
  if (criteria.length === 0) return "empty";

  const statuses = criteria.map(getCriterionStatus);
  const satisfiedCount = statuses.filter((s) => s === "satisfied").length;

  if (satisfiedCount === criteria.length) return "satisfied";
  if (satisfiedCount > 0 || statuses.some((s) => s === "partial")) return "partial";
  return "empty";
};

// --- Hook ---

export const useStandardsWithCriteria = (
  cycleId: string,
  fileTypeId?: string,
) => {
  const [standardsWithCriteria, setStandardsWithCriteria] = useState<Standard[]>([]);
  const [criteriaLoading, setCriteriaLoading] = useState<boolean>(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [expandedStandardIds, setExpandedStandardIds] = useState<Record<string, boolean>>({});
  const [autoExpandEnabled, setAutoExpandEnabled] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const toggleStandard = (standardId: string) => {
    setExpandedStandardIds((prev) => ({
      ...prev,
      [standardId]: !(prev[standardId] ?? true),
    }));
  };

  const expandAll = useCallback(() => {
    setExpandedStandardIds((prev) => {
      const all: Record<string, boolean> = { ...prev };
      standardsWithCriteria.forEach((s) => {
        all[s.Id] = true;
      });
      return all;
    });
    setAutoExpandEnabled(true);
  }, [standardsWithCriteria]);

  const collapseAll = useCallback(() => {
    setExpandedStandardIds((prev) => {
      const allCollapsed: Record<string, boolean> = { ...prev };
      standardsWithCriteria.forEach((s) => {
        allCollapsed[s.Id] = false;
      });
      return allCollapsed;
    });
    setAutoExpandEnabled(false);
  }, [standardsWithCriteria]);

  const fetchStandardsWithCriteria = useCallback(
    async (cycleId: string, fileTypeId?: string) => {
      setCriteriaLoading(true);
      setCriteriaError(null);

      try {
        const res = await standardService.getListWithCriteria({
          CycleId: cycleId,
          FileTypeId: fileTypeId || undefined,
        });

        if (res.Success) {
          const standards = (res.Data || []) as Standard[];
          setStandardsWithCriteria(standards);
          const expanded: Record<string, boolean> = {};
          standards.forEach((standard) => {
            expanded[standard.Id] = true;
          });
          setExpandedStandardIds(expanded);
          setAutoExpandEnabled(true);
        } else {
          setStandardsWithCriteria([]);
          setExpandedStandardIds({});
          setAutoExpandEnabled(true);
          setCriteriaError("Không thể tải danh sách tiêu chuẩn.");
        }
      } catch (error) {
        console.error(error);
        setStandardsWithCriteria([]);
        setExpandedStandardIds({});
        setAutoExpandEnabled(true);
        setCriteriaError("Không thể tải danh sách tiêu chuẩn.");
      } finally {
        setCriteriaLoading(false);
      }
    },
    [],
  );

  // Fetch when cycleId changes (fileTypeId is no longer required)
  useEffect(() => {
    if (!cycleId) {
      setStandardsWithCriteria([]);
      setExpandedStandardIds({});
      setAutoExpandEnabled(true);
      setCriteriaError(null);
      setCriteriaLoading(false);
      return;
    }

    fetchStandardsWithCriteria(cycleId, fileTypeId);
  }, [cycleId, fileTypeId, fetchStandardsWithCriteria]);

  // Compute matching criterion IDs based on selectedFileTypeId
  const getMatchingCriterionIds = useCallback(
    (selectedFileTypeId?: string): Set<string> => {
      if (!selectedFileTypeId) return new Set();
      const ids = new Set<string>();
      standardsWithCriteria.forEach((std) => {
        (std.Criterions || []).forEach((crit) => {
          if (
            crit.CriterionRequirements?.some(
              (req) => req.FileTypeId === selectedFileTypeId,
            )
          ) {
            ids.add(crit.Id);
          }
        });
      });
      return ids;
    },
    [standardsWithCriteria],
  );

  // Compute stats
  const stats = useMemo(() => {
    const allCriteria = standardsWithCriteria.flatMap((s) => s.Criterions || []);
    return {
      totalCriteria: allCriteria.length,
      satisfiedCriteria: allCriteria.filter((c) => getCriterionStatus(c) === "satisfied").length,
      partialCriteria: allCriteria.filter((c) => getCriterionStatus(c) === "partial").length,
      emptyCriteria: allCriteria.filter((c) => getCriterionStatus(c) === "empty").length,
    };
  }, [standardsWithCriteria]);

  // Filter standards based on filterMode
  const filteredStandards = useMemo(() => {
    if (filterMode === "all") return standardsWithCriteria;
    return standardsWithCriteria
      .map((std) => ({
        ...std,
        Criterions: (std.Criterions || []).filter(
          (c) => getCriterionStatus(c) === filterMode,
        ),
      }))
      .filter((std) => (std.Criterions || []).length > 0);
  }, [standardsWithCriteria, filterMode]);

  // Auto-expand standards containing matching criteria when selectedFileTypeId changes
  const autoExpandMatching = useCallback(
    (selectedFileTypeId?: string) => {
      if (!selectedFileTypeId || !autoExpandEnabled) return;
      setExpandedStandardIds((prev) => {
        const next = { ...prev };
        standardsWithCriteria.forEach((std) => {
          if (
            (std.Criterions || []).some((crit) =>
              crit.CriterionRequirements?.some(
                (req) => req.FileTypeId === selectedFileTypeId,
              ),
            )
          ) {
            next[std.Id] = true;
          }
        });
        return next;
      });
    },
    [standardsWithCriteria, autoExpandEnabled],
  );

  return {
    standardsWithCriteria,
    filteredStandards,
    criteriaLoading,
    criteriaError,
    expandedStandardIds,
    toggleStandard,
    expandAll,
    collapseAll,
    filterMode,
    setFilterMode,
    stats,
    getMatchingCriterionIds,
    autoExpandMatching,
  };
};
