export enum NutrientesTipos {
  Energia = "Energía",
  // Macronutrientes
  Proteinas = "Proteinas",
  Carbohidratos = "Carbohidratos",
  GrasaTotal = "Grasa Total",
  // Minerales
  Calcio = "Calcio",
  Hierro = "Hierro",
  Potasio = "Potasio",
  Magnesio = "Magnesio",
  Sodio = "Sodio",
  Fosforo = "Fósforo",
  Yodo = "Yodo",
  Selenio = "Selenio",
  Zinc = "Zinc",
  // Vitaminas
  VitaminaA = "Vitamina A",
  //VitaminaB1 = "Vitamina B1",
  //VitaminaB2 = "Vitamina B2",
  VitaminaB6 = "Vitamina B6",
  VitaminaB12 = "Vitamina B12",
  VitaminaC = "Vitamina C",
  VitaminaD = "Vitamina D",
  VitaminaE = "Vitamina E",
  // Varios
  Fibra = "Fibra",
  Colesterol = "Colesterol",
}

export interface Nutriente {
  nombre: NutrientesTipos;
  cantidad: number;
  unidad: string;
}

/**
 * Función para obtener la unidad según el nombre del nutriente
 * @param nombre nombre del nutriente
 * @returns una string con la unidad correspondiente a ese nutriente
 */
export function getUnitFromName(nombre: NutrientesTipos): string {
  switch (nombre) {
    case NutrientesTipos.Energia:
      return "kcal";

    case NutrientesTipos.Proteinas:
    case NutrientesTipos.Carbohidratos:
    case NutrientesTipos.GrasaTotal:
    case NutrientesTipos.Fibra:
      return "g";

    case NutrientesTipos.VitaminaA:
    case NutrientesTipos.VitaminaD:
    case NutrientesTipos.VitaminaB12:
    case NutrientesTipos.Yodo:
    case NutrientesTipos.Selenio:
      return "ug";

    case NutrientesTipos.VitaminaB6:
    case NutrientesTipos.VitaminaC:
    case NutrientesTipos.VitaminaE:
    case NutrientesTipos.Calcio:
    case NutrientesTipos.Hierro:
    case NutrientesTipos.Potasio:
    case NutrientesTipos.Magnesio:
    case NutrientesTipos.Sodio:
    case NutrientesTipos.Fosforo:
    case NutrientesTipos.Zinc:
    case NutrientesTipos.Colesterol:
      return "mg";

    default:
      return "";
  }
}
