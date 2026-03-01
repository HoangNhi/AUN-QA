import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { useCycleOptions } from "@/features/catalog/hooks/useCycleOptions";
import { useStandardSetOptions } from "@/features/catalog/hooks/useStandardSetOptions";
import StandardCriteriaTable from "@/features/catalog/components/StandardCriteriaTable";

interface CriteriaMappingPanelProps {
    form: UseFormReturn<any>;
    cycleIdForm: string;
    fileTypeIdForm: string;
    standardSetId: string;
    setStandardSetId: (val: string) => void;
    assignedStandardIds: string[];
    cycleId_Change: (val: string) => Promise<void>;
}

export function CriteriaMappingPanel({
    form,
    cycleIdForm,
    fileTypeIdForm,
    standardSetId,
    setStandardSetId,
    assignedStandardIds,
    cycleId_Change,
}: CriteriaMappingPanelProps) {
    const { options: cycleOptions, isLoading: isCycleLoading } = useCycleOptions();
    const { options: standardSetOptions, isLoading: isStandardSetLoading } = useStandardSetOptions();

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 p-2">
            {/* Cycle Selection */}
            <FormField
                control={form.control}
                name="cycleId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            Chu kỳ <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                            <Combobox
                                options={cycleOptions}
                                loading={isCycleLoading}
                                value={field.value}
                                onValueChange={async (val) => {
                                    field.onChange(val || "");
                                    cycleId_Change(val || "");
                                }}
                                placeholder="Chọn chu kỳ"
                                searchPlaceholder="Tìm kiếm chu kỳ..."
                                emptyText="Không tìm thấy chu kỳ."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Standard Set */}
            <div className="space-y-2">
                <FormLabel>
                    Bộ tiêu chuẩn <span className="text-red-500">*</span>
                </FormLabel>
                <Combobox
                    options={standardSetOptions}
                    loading={isStandardSetLoading}
                    value={standardSetId}
                    onValueChange={(val) => setStandardSetId(val || "")}
                    placeholder="Chọn bộ tiêu chuẩn"
                    searchPlaceholder="Tìm kiếm bộ tiêu chuẩn..."
                    emptyText="Không tìm thấy bộ tiêu chuẩn."
                    readonly={true}
                />
            </div>

            {/* Criteria Table */}
            <StandardCriteriaTable
                cycleId={cycleIdForm}
                selectedFileTypeId={fileTypeIdForm}
                assignedStandardIds={assignedStandardIds}
            />
            {cycleIdForm && (
                <p className="text-[11px] text-slate-400 px-1 pt-1 leading-relaxed">
                    Tiêu chí lọc theo loại tài liệu đã chọn. Tiến độ cập nhật sau khi minh chứng được phê duyệt.
                </p>
            )}
        </div>
    );
}
