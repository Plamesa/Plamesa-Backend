import * as express from "express";
import { ActivityLevel, Gender } from "../models/enum/userData.js";

export const nutrientsUserConsume = express.Router();

nutrientsUserConsume.get('/calcNutrientsUser', async (req, res) => {
  try {
    const { gender, weight, height, age, activityLevel } = req.body;

    // Calcular metabolismo basal
    let basalMetabolism: number;
    if (gender === Gender.Masculino) {
      basalMetabolism = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      basalMetabolism = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calcular total de kcal recomendadas
    const activityLevels: { [key in ActivityLevel]: number } = {
      [ActivityLevel.Sedentario]: 1.2,
      [ActivityLevel.Ligero]: 1.375,
      [ActivityLevel.Moderado]: 1.55,
      [ActivityLevel.Activo]: 1.725,
      [ActivityLevel.MuyActivo]: 1.9,
      [ActivityLevel.Vacio]: 0,
    };

    const totalKcal = basalMetabolism * activityLevels[activityLevel as ActivityLevel];

    // Calcular kcal para la comida (representa el 30% del total)
    const kcalPerMeal = totalKcal * 0.3;

    // Porcentaje de macros 
    const proteinMinPercentage = 0.1;
    const proteinMaxPercentage = 0.35;
    const carbMinPercentage = 0.45;
    const carbMaxPercentage = 0.65;
    const fatMinPercentage = 0.2;
    const fatMaxPercentage = 0.35;

    // Calcular cantidades de macros en gramos
    const proteinGramsMin = (kcalPerMeal * proteinMinPercentage) / 4; // 1g de proteína = 4 kcal
    const proteinGramsMax = (kcalPerMeal * proteinMaxPercentage) / 4;
    const carbGramsMin = (kcalPerMeal * carbMinPercentage) / 4; // 1g de carbohidrato = 4 kcal
    const carbGramsMax = (kcalPerMeal * carbMaxPercentage) / 4; 
    const fatGramsMin = (kcalPerMeal * fatMinPercentage) / 9; // 1g de grasa = 9 kcal
    const fatGramsMax = (kcalPerMeal * fatMaxPercentage) / 9; 

    // Enviar respuesta en formato JSON
    res.json({
      basalMetabolism,
      totalKcal,
      kcalPerMeal,
      macros: {
        proteinMin: {
          amount: proteinGramsMin,
          percentage: proteinMinPercentage,
        },
        proteinMax: {
          amount: proteinGramsMax,
          percentage: proteinMaxPercentage,
        },
        carbohydrateMin: {
          amount: carbGramsMin,
          percentage: carbMinPercentage,
        },
        carbohydrateMax: {
          amount: carbGramsMax,
          percentage: carbMaxPercentage,
        },
        fatMin: {
          amount: fatGramsMin,
          percentage: fatMinPercentage,
        },
        fatMax: {
          amount: fatGramsMax,
          percentage: fatMaxPercentage,
        },
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});