import {
  vendoThemeSchema,
} from "@vendoai/core/apps";
import theme from "../../.vendo/theme.json";

export const mapleTheme = vendoThemeSchema.parse(theme);
