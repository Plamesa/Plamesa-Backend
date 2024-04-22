export enum NutrientsTypes {
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
  Sal = "Sal",
  Azucar = "Azúcares",
  GrasaSaturada = "Grasas Saturadas",
  Fibra = "Fibra",
  Colesterol = "Colesterol",
}

export interface Nutrient {
  name: NutrientsTypes;
  amount: number;
  unit: string;
}

/**
 * Función para obtener la unidad según el nombre del nutriente
 * @param nombre nombre del nutriente
 * @returns una string con la unidad correspondiente a ese nutriente
 */
export function getUnitFromName(name: NutrientsTypes): string {
  switch (name) {
    case NutrientsTypes.Energia:
      return "kcal";

    case NutrientsTypes.Proteinas:
    case NutrientsTypes.Carbohidratos:
    case NutrientsTypes.GrasaTotal:
    case NutrientsTypes.Sal:
    case NutrientsTypes.Azucar:
    case NutrientsTypes.GrasaSaturada:
    case NutrientsTypes.Fibra:
      return "g";

    case NutrientsTypes.VitaminaA:
    case NutrientsTypes.VitaminaD:
    case NutrientsTypes.VitaminaB12:
    case NutrientsTypes.Yodo:
    case NutrientsTypes.Selenio:
      return "ug";

    case NutrientsTypes.VitaminaB6:
    case NutrientsTypes.VitaminaC:
    case NutrientsTypes.VitaminaE:
    case NutrientsTypes.Calcio:
    case NutrientsTypes.Hierro:
    case NutrientsTypes.Potasio:
    case NutrientsTypes.Magnesio:
    case NutrientsTypes.Sodio:
    case NutrientsTypes.Fosforo:
    case NutrientsTypes.Zinc:
    case NutrientsTypes.Colesterol:
      return "mg";

    default:
      return "";
  }
}


/**
 * Función para validar que la lista de nutrientes indicados incluya los obligados
 * @param nutrients Listado de nutrientes introducidos
 * @returns si se incluyen los nutrientes obligatorios
 */
export function mandatoryNutrients(nutrients: Nutrient[]): boolean {
  const requiredNutrients = [NutrientsTypes.Energia, NutrientsTypes.Proteinas, NutrientsTypes.Carbohidratos, NutrientsTypes.GrasaTotal, NutrientsTypes.GrasaSaturada, NutrientsTypes.Sal, NutrientsTypes.Azucar];
  const nutrientNames = nutrients.map((nutrient) => nutrient.name);

  // Comprobar que cada nutriente requerido está en la lista de nutrientes
  return requiredNutrients.every((requiredNutrient) =>
    nutrientNames.includes(requiredNutrient)
  );
}