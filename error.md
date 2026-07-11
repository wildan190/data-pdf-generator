7:39:52 PM: src/components/dialogs/ExportDialog.vue:299:21 - error TS2339: Property 'id' does not exist on type '{ divisionId: number; divisionName: string; createdAt: Date; }'.
7:39:52 PM: 299     value: division.id,
7:39:52 PM:                         ~~
7:39:52 PM: src/components/dialogs/ExportDialog.vue:300:21 - error TS2339: Property 'name' does not exist on type '{ divisionId: number; divisionName: string; createdAt: Date; }'.
7:39:52 PM: 300     label: division.name
7:39:52 PM:                         ~~~~
7:39:52 PM: src/components/dialogs/ExportDialog.vue:430:3 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
7:39:52 PM:   Type 'undefined' is not assignable to type 'string'.
7:39:52 PM: 430   dateTo.value = today.toISOString().split('T')[0]
7:39:52 PM:       ~~~~~~~~~~~~
7:39:52 PM: src/components/dialogs/ExportDialog.vue:431:3 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
7:39:52 PM:   Type 'undefined' is not assignable to type 'string'.
7:39:52 PM: 431   dateFrom.value = thirtyDaysAgo.toISOString().split('T')[0]
7:39:52 PM:       ~~~~~~~~~~~~~~
7:39:52 PM: src/components/forms/DivisionForm.vue:99:11 - error TS2322: Type 'string | undefined' is not assignable to type 'string | null'.
7:39:52 PM:   Type 'undefined' is not assignable to type 'string | null'.
7:39:52 PM: 99           errors.divisionName = validation.message
7:39:52 PM:              ~~~~~~~~~~~~~~~~~~~
7:39:52 PM: src/components/forms/InventoryAssetForm.vue:17:8 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:52 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:52 PM: 17       :error="errors.categoryId"
7:39:52 PM:           ~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:52 PM:     66   error?: string
7:39:52 PM:          ~~~~~
7:39:52 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/components/forms/InventoryAssetForm.vue:37:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:52 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:52 PM: 37         :error="errors.unitMeasure"
7:39:52 PM:             ~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:52 PM:     66   error?: string
7:39:52 PM:          ~~~~~
7:39:52 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/components/forms/InventoryAssetForm.vue:206:3 - error TS2322: Type 'string | boolean | undefined' is not assignable to type 'boolean'.
7:39:52 PM:   Type 'undefined' is not assignable to type 'boolean'.
7:39:52 PM: 206   return isFormValid.value
7:39:52 PM:       ~~~~~~
7:39:52 PM: src/components/forms/MaterialTransactionForm.vue:9:8 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:52 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:52 PM: 9       :error="errors.assetId"
7:39:52 PM:          ~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:52 PM:     66   error?: string
7:39:52 PM:          ~~~~~
7:39:52 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/components/forms/MaterialTransactionForm.vue:26:10 - error TS4104: The type 'readonly [{ readonly value: "masuk"; readonly label: "Masuk (Incoming)"; }, { readonly value: "keluar"; readonly label: "Keluar (Outgoing)"; }]' is 'readonly' and cannot be assigned to the mutable type '(string | number | SelectOption)[]'.
7:39:52 PM: 26         :options="transactionTypeOptions"
7:39:52 PM:             ~~~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:61:3
7:39:52 PM:     61   options: (SelectOption | string | number)[]
7:39:52 PM:          ~~~~~~~
7:39:52 PM:     The expected type comes from property 'options' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/components/forms/MaterialTransactionForm.vue:27:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:52 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:52 PM: 27         :error="errors.transactionType"
7:39:52 PM:             ~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:52 PM:     66   error?: string
7:39:52 PM:          ~~~~~
7:39:52 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/components/forms/MaterialTransactionForm.vue:51:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:52 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:52 PM: 51         :error="errors.divisionId"
7:39:52 PM:             ~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:52 PM:     66   error?: string
7:39:52 PM:          ~~~~~
7:39:52 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/components/forms/MaterialTransactionForm.vue:59:10 - error TS4104: The type 'readonly [{ readonly value: "prioritas"; readonly label: "Prioritas (High Priority)"; readonly color: "red"; }, { readonly value: "urgen"; readonly label: "Urgen (Urgent)"; readonly color: "orange"; }, { ...; }]' is 'readonly' and cannot be assigned to the mutable type '(string | number | SelectOption)[]'.
7:39:52 PM: 59         :options="priorityOptions"
7:39:52 PM:             ~~~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:61:3
7:39:52 PM:     61   options: (SelectOption | string | number)[]
7:39:52 PM:          ~~~~~~~
7:39:52 PM:     The expected type comes from property 'options' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/components/forms/MaterialTransactionForm.vue:60:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:52 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:52 PM: 60         :error="errors.priorityStatus"
7:39:52 PM:             ~~~~~
7:39:52 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:52 PM:     66   error?: string
7:39:52 PM:          ~~~~~
7:39:52 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:52 PM: src/services/export.service.ts:356:28 - error TS2304: Cannot find name 'currentExport'.
7:39:52 PM: 356         const reportType = currentExport?.reportType ?? `Export at index ${i}`;
7:39:52 PM:                                ~~~~~~~~~~~~~
7:39:52 PM: src/stores/division.store.ts:102:11 - error TS2322: Type '{ divisionId: number; divisionName: string; createdAt: Date; transactionCount?: number | undefined; }' is not assignable to type '{ transactionCount: number; divisionId: number; divisionName: string; createdAt: Date; }'.
7:39:52 PM:   Types of property 'transactionCount' are incompatible.
7:39:52 PM:     Type 'number | undefined' is not assignable to type 'number'.
7:39:52 PM:       Type 'undefined' is not assignable to type 'number'.
7:39:52 PM: 102           divisionsWithStats.value[statsIndex] = {
7:39:52 PM:               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
7:39:52 PM: src/stores/material-transaction.store.ts:161:9 - error TS2322: Type 'unknown' is not assignable to type '{ totalTransactions: number; totalIncoming: number; totalOutgoing: number; pendingCount: number; urgentCount: number; } | { totalTransactions: number; totalIncoming: number; totalOutgoing: number; pendingCount: number; urgentCount: number; } | null'.
7:39:52 PM: 161         transactionSummary.value = data
7:39:52 PM:             ~~~~~~~~~~~~~~~~~~~~~~~~
7:39:52 PM: src/stores/material-type.store.ts:116:11 - error TS2322: Type '{ categoryId: number; categoryName: string; description?: string; createdAt: Date; assetCount?: number | undefined; totalStockQuantity?: number | undefined; }' is not assignable to type '{ assetCount: number; totalStockQuantity: number; categoryId: number; categoryName: string; description?: string | undefined; createdAt: Date; }'.
7:39:52 PM:   Types of property 'assetCount' are incompatible.
7:39:52 PM:     Type 'number | undefined' is not assignable to type 'number'.
7:39:52 PM:       Type 'undefined' is not assignable to type 'number'.
7:39:52 PM: 116           materialTypesWithStats.value[statsIndex] = {
7:39:52 PM:               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
7:39:52 PM: src/stores/notification.store.ts:127:5 - error TS2349: This expression is not callable.
7:39:52 PM:   No constituent of type 'string | Error' is callable.
7:39:52 PM: 127     error(title, errorMessage)
7:39:52 PM:         ~~~~~
7:39:52 PM: src/utils/export.utils.ts:101:29 - error TS2774: This condition will always return true since this function is always defined. Did you mean to call it instead?
7:39:52 PM: 101     return !!(window.URL && window.URL.createObjectURL && document.createElement)
7:39:52 PM:                                 ~~~~~~~~~~~~~~~~~~~~~~~~~~
7:39:53 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
7:39:53 PM: src/components/forms/DivisionForm.vue:99:11 - error TS2322: Type 'string | undefined' is not assignable to type 'string | null'.
7:39:53 PM:   Type 'undefined' is not assignable to type 'string | null'.
7:39:53 PM: 99           errors.divisionName = validation.message
7:39:53 PM:              ~~~~~~~~~~~~~~~~~~~
7:39:53 PM: src/components/forms/InventoryAssetForm.vue:17:8 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:53 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:53 PM: 17       :error="errors.categoryId"
7:39:53 PM:           ~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:53 PM:     66   error?: string
7:39:53 PM:          ~~~~~
7:39:53 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/components/forms/InventoryAssetForm.vue:37:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:53 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:53 PM: 37         :error="errors.unitMeasure"
7:39:53 PM:             ~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:53 PM:     66   error?: string
7:39:53 PM:          ~~~~~
7:39:53 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/components/forms/InventoryAssetForm.vue:206:3 - error TS2322: Type 'string | boolean | undefined' is not assignable to type 'boolean'.
7:39:53 PM:   Type 'undefined' is not assignable to type 'boolean'.
7:39:53 PM: 206   return isFormValid.value
7:39:53 PM:       ~~~~~~
7:39:53 PM: src/components/forms/MaterialTransactionForm.vue:9:8 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:53 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:53 PM: 9       :error="errors.assetId"
7:39:53 PM:          ~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:53 PM:     66   error?: string
7:39:53 PM:          ~~~~~
7:39:53 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/components/forms/MaterialTransactionForm.vue:26:10 - error TS4104: The type 'readonly [{ readonly value: "masuk"; readonly label: "Masuk (Incoming)"; }, { readonly value: "keluar"; readonly label: "Keluar (Outgoing)"; }]' is 'readonly' and cannot be assigned to the mutable type '(string | number | SelectOption)[]'.
7:39:53 PM: 26         :options="transactionTypeOptions"
7:39:53 PM:             ~~~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:61:3
7:39:53 PM:     61   options: (SelectOption | string | number)[]
7:39:53 PM:          ~~~~~~~
7:39:53 PM:     The expected type comes from property 'options' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/components/forms/MaterialTransactionForm.vue:27:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:53 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:53 PM: 27         :error="errors.transactionType"
7:39:53 PM:             ~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:53 PM:     66   error?: string
7:39:53 PM:          ~~~~~
7:39:53 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/components/forms/MaterialTransactionForm.vue:51:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:53 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:53 PM: 51         :error="errors.divisionId"
7:39:53 PM:             ~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:53 PM:     66   error?: string
7:39:53 PM:          ~~~~~
7:39:53 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/components/forms/MaterialTransactionForm.vue:59:10 - error TS4104: The type 'readonly [{ readonly value: "prioritas"; readonly label: "Prioritas (High Priority)"; readonly color: "red"; }, { readonly value: "urgen"; readonly label: "Urgen (Urgent)"; readonly color: "orange"; }, { ...; }]' is 'readonly' and cannot be assigned to the mutable type '(string | number | SelectOption)[]'.
7:39:53 PM: 59         :options="priorityOptions"
7:39:53 PM:             ~~~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:61:3
7:39:53 PM:     61   options: (SelectOption | string | number)[]
7:39:53 PM:          ~~~~~~~
7:39:53 PM:     The expected type comes from property 'options' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/components/forms/MaterialTransactionForm.vue:60:10 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
7:39:53 PM:   Type 'null' is not assignable to type 'string | undefined'.
7:39:53 PM: 60         :error="errors.priorityStatus"
7:39:53 PM:             ~~~~~
7:39:53 PM:   src/components/ui/BaseSelect.vue:66:3
7:39:53 PM:     66   error?: string
7:39:53 PM:          ~~~~~
7:39:53 PM:     The expected type comes from property 'error' which is declared here on type '{ readonly modelValue?: string | number | undefined; readonly options: (string | number | SelectOption)[]; readonly label?: string | undefined; readonly placeholder?: string | undefined; ... 8 more ...; readonly "onUpdate:modelValue"?: ((value: string | number) => any) | undefined; } & VNodeProps & AllowedComponentP...'
7:39:53 PM: src/stores/dashboard.store.ts:139:5 - error TS2322: Type 'Timeout' is not assignable to type 'number'.
7:39:53 PM: 139     refreshInterval.value = setInterval(async () => {
7:39:53 PM:         ~~~~~~~~~~~~~~~~~~~~~
7:39:53 PM: src/stores/division.store.ts:102:11 - error TS2322: Type '{ divisionId: number; divisionName: string; createdAt: Date; transactionCount?: number | undefined; }' is not assignable to type '{ transactionCount: number; divisionId: number; divisionName: string; createdAt: Date; }'.
7:39:53 PM:   Types of property 'transactionCount' are incompatible.
7:39:53 PM:     Type 'number | undefined' is not assignable to type 'number'.
7:39:53 PM:       Type 'undefined' is not assignable to type 'number'.
7:39:53 PM: 102           divisionsWithStats.value[statsIndex] = {
7:39:53 PM:               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
7:39:53 PM: src/stores/material-transaction.store.ts:161:9 - error TS2322: Type 'unknown' is not assignable to type '{ totalTransactions: number; totalIncoming: number; totalOutgoing: number; pendingCount: number; urgentCount: number; } | { totalTransactions: number; totalIncoming: number; totalOutgoing: number; pendingCount: number; urgentCount: number; } | null'.
7:39:53 PM: 161         transactionSummary.value = data
7:39:53 PM:             ~~~~~~~~~~~~~~~~~~~~~~~~
7:39:53 PM: src/stores/material-type.store.ts:116:11 - error TS2322: Type '{ categoryId: number; categoryName: string; description?: string; createdAt: Date; assetCount?: number | undefined; totalStockQuantity?: number | undefined; }' is not assignable to type '{ assetCount: number; totalStockQuantity: number; categoryId: number; categoryName: string; description?: string | undefined; createdAt: Date; }'.
7:39:53 PM:   Types of property 'assetCount' are incompatible.
7:39:53 PM:     Type 'number | undefined' is not assignable to type 'number'.
7:39:53 PM:       Type 'undefined' is not assignable to type 'number'.
7:39:53 PM: 116           materialTypesWithStats.value[statsIndex] = {
7:39:53 PM:               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
7:39:53 PM: src/stores/notification.store.ts:127:5 - error TS2349: This expression is not callable.
7:39:53 PM:   No constituent of type 'string | Error' is callable.
7:39:53 PM: 127     error(title, errorMessage)
7:39:53 PM:         ~~~~~
7:39:53 PM: Found 35 errors.
7:39:53 PM: ERROR: "type-check" exited with 2.
7:39:53 PM: ​
7:39:53 PM: "build.command" failed                                        
7:39:53 PM: ────────────────────────────────────────────────────────────────
7:39:53 PM: ​
7:39:53 PM:   Error message
7:39:53 PM:   Command failed with exit code 1: npm run build (https://ntl.fyi/exit-code-1)
7:39:53 PM: ​
7:39:53 PM:   Error location
7:39:53 PM:   In build.command from netlify.toml:
7:39:53 PM:   npm run build
7:39:53 PM: ​
7:39:53 PM:   Resolved config
7:39:53 PM:   build:
7:39:53 PM:     command: npm run build
7:39:53 PM:     commandOrigin: config
7:39:53 PM:     environment:
7:39:53 PM:       - DATABASE_URL
7:39:53 PM:       - FRONTEND_URL
7:39:53 PM:       - JWT_EXPIRES_IN
7:39:53 PM:       - JWT_SECRET
7:39:53 PM:       - MAX_FILE_SIZE
7:39:53 PM:       - NODE_ENV
7:39:53 PM:       - PORT
7:39:53 PM:       - REPORTS_PATH
7:39:53 PM:       - TEMP_PATH
7:39:53 PM:       - UPLOAD_PATH
7:39:53 PM:       - NODE_VERSION
7:39:53 PM:     publish: /opt/build/repo/dist
7:39:53 PM:     publishOrigin: config
7:39:53 PM:   functionsDirectory: /opt/build/repo/netlify/functions
7:39:53 PM:   redirects:
7:39:53 PM:     - from: /api/*
      status: 200
      to: /.netlify/functions/api
    - from: /*
      status: 200
      to: /index.html
  redirectsOrigin: config
7:39:53 PM: Build failed due to a user error: Build script returned non-zero exit code: 2
7:39:53 PM: Failing build: Failed to build site
7:39:54 PM: Finished processing build request in 31.467s