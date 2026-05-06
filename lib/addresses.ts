export type LocationKey = "denver" | "phoenix" | "vegas" | "dfw";

export interface LocationInfo {
  key: LocationKey;
  city: string;
  shortLabel: string;
  address: string;
}

export const LOCATIONS: Record<LocationKey, LocationInfo> = {
  denver: {
    key: "denver",
    city: "Denver",
    shortLabel: "Denver",
    address: "4905 Lima Street, Denver, CO 80239",
  },
  phoenix: {
    key: "phoenix",
    city: "Phoenix",
    shortLabel: "Phoenix",
    address: "3331 N 35th Ave, Phoenix, AZ 85017",
  },
  vegas: {
    key: "vegas",
    city: "Las Vegas",
    shortLabel: "Las Vegas",
    address: "1530 E Pama Ln A, Las Vegas, NV 89119",
  },
  dfw: {
    key: "dfw",
    city: "DFW",
    shortLabel: "DFW",
    address: "627 112th St, Arlington, TX 76011",
  },
};

// Always shown across the bottom-of-photo strip in the order seen on the card
export const LOCATION_DISPLAY_ORDER: LocationKey[] = [
  "denver",
  "vegas",
  "phoenix",
  "dfw",
];
