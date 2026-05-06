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
  biggerSmile: boolean;
  lightingEnhancement: boolean;
  location: LocationKey;
  headshotDataUrl: string | null;
  referenceDataUrl: string | null;
}

export const DEFAULT_EMPLOYEE: EmployeeData = {
  name: "",
  title: "",
  cell: "",
  main: "877-779-9431",
  email: "",
  website: "www.DiscountForklift.us",
  hablaEspanol: false,
  smileEnhancement: false,
  biggerSmile: false,
  lightingEnhancement: false,
  location: "denver",
  headshotDataUrl: null,
  referenceDataUrl: null,
};