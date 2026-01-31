import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Criterion } from '../types/criterion.types';

export const useCriteria = (initialCriteria: Criterion[] = []) => {
    const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria);

    const addCriterion = useCallback(() => {
        const newCriterion: Criterion = {
            Id: uuidv4(),
            StandardId: '',
            StandardName: '',
            Code: '',
            Name: '',
            Description: '',
            FileTypeId: '',
            FileTypeName: '',
            IsActived: true,
        };
        setCriteria(prev => [...prev, newCriterion]);
    }, []);

    const updateCriterion = useCallback((id: string, updates: Partial<Criterion>) => {
        setCriteria(prev => prev.map(c =>
            c.Id === id ? { ...c, ...updates } : c
        ));
    }, []);

    const deleteCriterion = useCallback((id: string) => {
        setCriteria(prev => prev.filter(c => c.Id !== id));
    }, []);

    const resetCriteria = useCallback((newCriteria: Criterion[]) => {
        setCriteria(newCriteria);
    }, []);

    return {
        criteria,
        setCriteria,
        addCriterion,
        updateCriterion,
        deleteCriterion,
        resetCriteria,
    };
};
