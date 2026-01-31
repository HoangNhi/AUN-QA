import { useState, useCallback } from "react";
import type { Criterion } from "@/features/catalog/types/standard.types";

export const useStandardCriteria = (initialCriterions: Criterion[] = []) => {
  const [criterions, setCriterions] = useState<Criterion[]>(initialCriterions);

  const addCriterion = useCallback((criterion: Criterion) => {
    setCriterions((prev) => [...prev, criterion]);
  }, []);

  const updateCriterion = useCallback((id: string, updates: Partial<Criterion>) => {
    setCriterions((prev) =>
      prev.map((c) => (c.Id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteCriterion = useCallback((id: string) => {
    setCriterions((prev) => prev.filter((c) => c.Id !== id));
  }, []);

  const validateCriterions = useCallback((): boolean => {
    return criterions.every(
      (c) => c.Code?.trim() && c.Name?.trim() && c.FileTypeId
    );
  }, [criterions]);

  const handlers = {
    addCriterion,
    updateCriterion,
    deleteCriterion,
    validateCriterions,
  };

  return { criterions, setCriterions, handlers };
};
