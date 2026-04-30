INSERT INTO "Menu" ("Id", "Name", "Controller", "SystemGroupId", "CanView", "CanAdd", "CanUpdate", "CanDelete", "CanApprove", "CanAnalyze", "IsShowMenu", "IsActived", "IsDeleted", "Sort", "CreatedAt", "CreatedBy")
VALUES (
    gen_random_uuid(),
    'Lưu vết nghiệp vụ',
    'auditlog',
    (SELECT "Id" FROM "SystemGroup" WHERE "Name" LIKE '%Hệ thống%' LIMIT 1),
    true, false, false, false, false, true,
    true, true, false, 99, now(), 'System'
);
