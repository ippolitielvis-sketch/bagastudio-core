export type BagaAccessoryType = "toggle";

export type BagaAccessory = {
  id: string;
  name: string;
  type: BagaAccessoryType;
  stateType: "accessory" | "insert";
  price: number;
};

export const accessoriesCatalog: BagaAccessory[] = [
  {
    id: "led",
    name: "LED",
    type: "toggle",
    stateType: "accessory",
    price: 180,
  },

  {
    id: "insert",
    name: "Inserto",
    type: "toggle",
    stateType: "insert",
    price: 150,
  },

  {
    id: "usb",
    name: "Presa USB",
    type: "toggle",
    stateType: "accessory",
    price: 85,
  },

  {
    id: "wireless_charge",
    name: "Caricatore Wireless",
    type: "toggle",
    stateType: "accessory",
    price: 140,
  },

  {
    id: "socket",
    name: "Presa 220V",
    type: "toggle",
    stateType: "accessory",
    price: 65,
  },

  {
    id: "hairdryer_holder",
    name: "Portaphon",
    type: "toggle",
    stateType: "accessory",
    price: 95,
  },

  {
    id: "tool_holder",
    name: "Porta Ferri",
    type: "toggle",
    stateType: "accessory",
    price: 120,
  },

  {
    id: "bag_hook",
    name: "Gancio Borsa",
    type: "toggle",
    stateType: "accessory",
    price: 45,
  },

  {
    id: "mirror_led",
    name: "LED Specchio",
    type: "toggle",
    stateType: "accessory",
    price: 220,
  },
];