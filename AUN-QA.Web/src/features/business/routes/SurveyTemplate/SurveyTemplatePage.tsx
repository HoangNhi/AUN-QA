import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useSurveyTemplate } from "../../hooks/useSurveyTemplate";
import { getColumns } from "./columns";
import PopupSurveyTemplate from "./PopupSurveyTemplate";
import { DataTable } from "./data-table";
import type { GetPermissionByUser } from "@/features/system/types/role.types";

const SurveyTemplatePage = () => {
  const {
    data,
    surveyTemplate,
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
    isLoading,
  } = useSurveyTemplate();

  const { permission } = useOutletContext<{
    permission: GetPermissionByUser | null;
  }>();

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        permission?.IsUpdated ?? true, // Default to true if permission is missing for dev
        permission?.IsDeleted ?? true
      ),
    [permission, showPopupDetail, deleteList]
  );

  return (
    <div className="container mx-auto">
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
        canAdd={permission?.IsAdded ?? true}
        canDelete={permission?.IsDeleted ?? true}
        isLoading={isFetching}
      />
      {isOpen && (
        <PopupSurveyTemplate
          key={surveyTemplate?.Id || "new"}
          surveyTemplate={surveyTemplate}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default SurveyTemplatePage;
