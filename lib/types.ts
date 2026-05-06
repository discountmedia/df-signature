import type { LocationKey } from "./addresses";

export interface EmployeeData {
  name: string;
  title: string;
  cell: string;
  main: string;
  email: string;
  website: string;
  hablaEspanol: boolean;
  smileEnhancement: boolean;
  lightingEnhancement: boolean;
  location: LocationKey;
  headshotDataUrl: string | null;     // Field 1
  referenceDataUrl: string | null;    // Field 2 (template)
}

export const DEFAULT_EMPLOYEE: EmployeeData = {
  name: "",
  title: "",
  cell: "",
  main: "",
  email: "",
  website: "www.DiscountForklift.us",
  hablaEspanol: false,
  smileEnhancement: false,
  lightingEnhancement: false,
  location: "denver",
  headshotDataUrl: null,
  referenceDataUrl: null,
};
