// @/constants/regions.ts
import { Region } from "@/types";

export const REGIONS: Region[] = [
  {
    id: 6,
    name: "Zinder",
    code: "ZIN",
    description: "Région de Zinder",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/zinder_ebghq6.png",
    stadium_name: "Stade de Zinder",
    stadium_image: "",
    color: "#00FFFF",
    total_fighters: 18,
    total_champions: 1,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // // competitions: null,
  },
  {
    id: 4,
    name: "Tillabéri",
    code: "TIL",
    description: "Région de Tillabéri",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/tillab%C3%A9ri_noad3j.png",
    stadium_name: "Stade de Tillabéri",
    stadium_image: "",
    color: "#FFFF00",
    total_fighters: 17,
    total_champions: 1,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // competitions: null,
  },
  {
    id: 8,
    name: "Diffa",
    code: "DIF",
    description: "Région de Diffa.",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/diffa_znkgh2.png",
    stadium_name: "Stade de Diffa",
    stadium_image: "",
    color: "#800080",
    total_fighters: 16,
    total_champions: 0,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // competitions: null,
  },
  {
    id: 1,
    name: "Niamey",
    code: "NIM",
    description: "Région de la capitale",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/niamey_bsl5ms.png",
    stadium_name: "Stade Général Seyni Kountché",
    stadium_image: "niamey-stadium.jpg",
    color: "#FF0000",
    total_fighters: 15,
    total_champions: 1,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // competitions: null,
  },
  {
    id: 7,
    name: "Agadez",
    code: "AGA",
    description: "Région d'Agadez",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/agadez_x1yqwe.png",
    stadium_name: "Stade d'Agadez",
    stadium_image: "",
    color: "#FFA500",
    total_fighters: 14,
    total_champions: 0,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // competitions: null,
  },
  {
    id: 2,
    name: "Dosso",
    code: "DOS",
    description: "Région de Dosso",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/dosso_p9xksy.png",
    stadium_name: "Stade de Dosso",
    stadium_image: "",
    color: "#008000",
    total_fighters: 13,
    total_champions: 0,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // competitions: null,
  },
  {
    id: 3,
    name: "Maradi",
    code: "MAR",
    description: "Région de Maradi",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/maradi_qg8hzx.png",
    stadium_name: "Stade de Maradi",
    stadium_image: "",
    color: "#0000FF",
    total_fighters: 12,
    total_champions: 0,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // competitions: null,
  },
  {
    id: 5,
    name: "Tahoua",
    code: "TAH",
    description: "Région de Tahoua",
    flag_image:
      "https://res.cloudinary.com/dwgbrbcf7/image/upload/tahoua_n3okmf.png",
    stadium_name: "Stade de Tahoua",
    stadium_image: "",
    color: "#FFC0CB",
    total_fighters: 11,
    total_champions: 0,
    created_at: "2025-11-10T15:59:37.443Z",
    coach: undefined,
    fighters: [
      /* ... */
    ],
    // competitions: null,
  },
] as const;
