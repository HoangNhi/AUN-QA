import { useMemo } from "react";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { useOutletContext } from "react-router-dom";
import { useCriterion } from "@/features/catalog/hooks/useCriterion";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import PopupCriterion from "./PopupCriterion";

const CriterionPage = () => {
    const {
        data,
        criterion,
        isOpen,
        pageRequest,
        rowSelection,
        setPageRequest,
        setRowSelection,
        getList,
        showPopupDetail,
        onOpenChange,
        saveChange,
        deleteList,
        isFetching,
    } = useCriterion();

    const { permission } = useOutletContext<{
        permission: GetPermissionByUser | null;
    }>();

    const columns = useMemo(
        () =>
            getColumns(
                showPopupDetail,
                deleteList,
                permission?.IsUpdated,
                permission?.IsDeleted
            ),
        [permission, showPopupDetail, deleteList]
    );

    return (
        <div className="container mx-auto ">
            <DataTable
                columns={columns}
                data={data.Data}
                totalRow={data.TotalRow}
                showPopupDetail={showPopupDetail}
                deleteList={deleteList}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
                pageRequest={pageRequest}
                setPageRequest={setPageRequest}
                getList={getList}
                canAdd={permission?.IsAdded}
                canDelete={permission?.IsDeleted}
                isLoading={isFetching}
            />
            {isOpen && (
                <PopupCriterion
                    key={criterion?.Id || "new"}
                    criterion={criterion}
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    saveChange={saveChange}
                />
            )}
        </div>
    );
};

export default CriterionPage;
