import { useCallback, useEffect, useState } from "react";
import type {
  Standard,
  CriterionRequirement,
} from "@/features/catalog/types/standard.types";
import { standardService } from "@/features/catalog/api/standard.api";

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

export const useStandardsWithCriteria = (
  cycleId: string,
  fileTypeId: string,
) => {
  const [standardsWithCriteria, setStandardsWithCriteria] = useState<
    Standard[]
  >([]);
  const [criteriaLoading, setCriteriaLoading] = useState<boolean>(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [expandedStandardIds, setExpandedStandardIds] = useState<
    Record<string, boolean>
  >({});

  const toggleStandard = (standardId: string) => {
    setExpandedStandardIds((prev) => ({
      ...prev,
      [standardId]: !prev[standardId],
    }));
  };

  const fetchStandardsWithCriteria = useCallback(
    async (cycleId: string, fileTypeId: string) => {
      setCriteriaLoading(true);
      setCriteriaError(null);

      try {
        const res = await standardService.getListWithCriteria({
          CycleId: cycleId,
          FileTypeId: fileTypeId,
        });

        if (res.Success) {
          const standards = (res.Data || []) as Standard[];
          setStandardsWithCriteria(standards);
          const expanded: Record<string, boolean> = {};
          standards.forEach((standard) => {
            expanded[standard.Id] = true;
          });
          setExpandedStandardIds(expanded);
        } else {
          setStandardsWithCriteria([]);
          setExpandedStandardIds({});
          setCriteriaError("Khong the tai danh sach tieu chuan.");
        }
      } catch (error) {
        console.error(error);
        setStandardsWithCriteria([]);
        setExpandedStandardIds({});
        setCriteriaError("Khong the tai danh sach tieu chuan.");
      } finally {
        setCriteriaLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!cycleId || !fileTypeId) {
      setStandardsWithCriteria([]);
      setExpandedStandardIds({});
      setCriteriaError(null);
      setCriteriaLoading(false);
      return;
    }

    fetchStandardsWithCriteria(cycleId, fileTypeId);
  }, [cycleId, fileTypeId, fetchStandardsWithCriteria]);

  return {
    standardsWithCriteria,
    criteriaLoading,
    criteriaError,
    expandedStandardIds,
    toggleStandard,
  };
};
