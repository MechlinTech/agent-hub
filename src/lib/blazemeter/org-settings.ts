import { createClient } from "@/lib/supabase/server";

import {

  DEFAULT_BLAZEMETER_ORG_CONFIG,

  parseBlazeMeterOrgConfig,

  type BlazeMeterOrgConfig,

} from "@/lib/blazemeter/types";



interface OrgSettingsRow {

  blazemeter_enabled: boolean;

  blazemeter_api_key_id: string | null;

  blazemeter_api_key_secret: string | null;

  blazemeter_test_provisioning_mode: string;

  blazemeter_account_id: number | null;

  blazemeter_workspace_id: number | null;

  blazemeter_project_id: number | null;

  blazemeter_account_name: string | null;

  blazemeter_workspace_name: string | null;

  blazemeter_project_name: string | null;

  blazemeter_reuse_test_id: number | null;

  blazemeter_reuse_test_name: string | null;

  blazemeter_default_location: string;

  blazemeter_last_validated_at: string | null;

}



function rowToConfig(row: OrgSettingsRow | null): BlazeMeterOrgConfig {

  if (!row) return { ...DEFAULT_BLAZEMETER_ORG_CONFIG };

  return parseBlazeMeterOrgConfig({

    enabled: row.blazemeter_enabled,

    apiKeyId: row.blazemeter_api_key_id,

    apiKeySecret: row.blazemeter_api_key_secret,

    testProvisioningMode:

      row.blazemeter_test_provisioning_mode === "reuse_existing"

        ? "reuse_existing"

        : "create_per_review",

    accountId: row.blazemeter_account_id,

    workspaceId: row.blazemeter_workspace_id,

    projectId: row.blazemeter_project_id,

    accountName: row.blazemeter_account_name,

    workspaceName: row.blazemeter_workspace_name,

    projectName: row.blazemeter_project_name,

    reuseTestId: row.blazemeter_reuse_test_id,

    reuseTestName: row.blazemeter_reuse_test_name,

    defaultLocation: row.blazemeter_default_location,

    lastValidatedAt: row.blazemeter_last_validated_at,

  });

}



function configToRow(config: BlazeMeterOrgConfig) {

  const now = new Date().toISOString();

  return {

    id: "default",

    blazemeter_enabled: config.enabled,

    blazemeter_api_key_id: config.apiKeyId,

    blazemeter_api_key_secret: config.apiKeySecret,

    blazemeter_test_provisioning_mode: config.testProvisioningMode,

    blazemeter_account_id: config.accountId,

    blazemeter_workspace_id: config.workspaceId,

    blazemeter_project_id: config.projectId,

    blazemeter_account_name: config.accountName,

    blazemeter_workspace_name: config.workspaceName,

    blazemeter_project_name: config.projectName,

    blazemeter_reuse_test_id: config.reuseTestId,

    blazemeter_reuse_test_name: config.reuseTestName,

    blazemeter_default_location: config.defaultLocation,

    blazemeter_last_validated_at: config.lastValidatedAt,

    updated_at: now,

  };

}



export async function getBlazeMeterOrgConfig(): Promise<BlazeMeterOrgConfig> {

  const supabase = await createClient();

  const { data, error } = await supabase

    .from("org_settings")

    .select(

      "blazemeter_enabled, blazemeter_api_key_id, blazemeter_api_key_secret, blazemeter_test_provisioning_mode, blazemeter_account_id, blazemeter_workspace_id, blazemeter_project_id, blazemeter_account_name, blazemeter_workspace_name, blazemeter_project_name, blazemeter_reuse_test_id, blazemeter_reuse_test_name, blazemeter_default_location, blazemeter_last_validated_at"

    )

    .eq("id", "default")

    .maybeSingle();



  if (error) throw new Error(error.message);

  return rowToConfig(data as OrgSettingsRow | null);

}



export async function saveBlazeMeterOrgConfig(config: BlazeMeterOrgConfig): Promise<void> {

  const supabase = await createClient();

  const row = configToRow(config);

  const { error } = await supabase.from("org_settings").upsert(row, { onConflict: "id" });

  if (error) throw new Error(error.message);

}

