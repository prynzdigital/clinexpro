import { deviceStaffLang } from "@/lib/staff-auth";
import { t, type StaffText } from "./i18n";

/** Browser-tab title in the language this phone uses. */
export const staffTitle = (key: keyof StaffText["titles"]) => async () => ({ title: t(await deviceStaffLang()).titles[key] });
