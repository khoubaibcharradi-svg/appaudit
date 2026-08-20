import { randomUUID } from "crypto";
import { DependsOn, QuestionDef, QuestionType, SectionDef } from "./types";

function q(
  text: string,
  type: QuestionType,
  weight: 1 | 2 | 3,
  required: boolean,
  dependsOn?: DependsOn
): QuestionDef {
  return { id: randomUUID(), text, type, weight, required, dependsOn };
}

/**
 * Standard starting point for new audit forms, built from the recurring
 * findings across S2I usine and dépôt audit reports (inventaire, caisse,
 * facturation, organisation, recouvrement, production, hygiène/sécurité).
 * Admins duplicate this template and adjust it rather than starting blank.
 */
export function buildStandardSections(): SectionDef[] {
  const stockMatch = q("Le stock physique correspond-il au stock système ?", "YES_NO", 3, true);
  const stockGap = q(
    "Précisez la nature et la valeur de l'écart constaté (article, quantité, montant)",
    "TEXT",
    2,
    true,
    { questionId: stockMatch.id, triggerValues: ["no"] }
  );
  const damagedGoods = q("Des articles endommagés ou périmés ont-ils été identifiés ?", "YES_NO", 2, true);
  const damagedGoodsDetail = q(
    "Détail des articles concernés et prix de liquidation proposé",
    "TEXT",
    1,
    true,
    { questionId: damagedGoods.id, triggerValues: ["yes"] }
  );
  const stockGapCount = q("Nombre d'articles en écart constatés", "NUMBER", 1, false);

  const cashGap = q(
    "Un écart a-t-il été constaté entre le système et les espèces encaissées ?",
    "YES_NO",
    3,
    true
  );
  const cashGapAmount = q("Montant de l'écart constaté (DT)", "NUMBER", 2, true, {
    questionId: cashGap.id,
    triggerValues: ["yes"],
  });
  const cashGapJustified = q("Un justificatif a-t-il été présenté par l'agent ?", "YES_NO", 1, true, {
    questionId: cashGap.id,
    triggerValues: ["yes"],
  });
  const cashGapRegularized = q("L'écart a-t-il été régularisé immédiatement ?", "YES_NO", 2, true, {
    questionId: cashGap.id,
    triggerValues: ["yes"],
  });

  const invoicingBeforeDelivery = q(
    "Les livraisons sont-elles systématiquement facturées avant sortie de marchandise ?",
    "SCALE",
    3,
    true
  );
  const invoicingGapDetail = q(
    "Précisez les cas de livraison sans facturation préalable et la régularisation effectuée",
    "TEXT",
    2,
    true,
    { questionId: invoicingBeforeDelivery.id, triggerValues: ["rarely", "never"] }
  );
  const discountValidated = q(
    "Les remises accordées sont-elles validées officiellement avant application ?",
    "SCALE",
    2,
    true
  );

  const staffingSufficient = q(
    "Les effectifs administratifs sont-ils suffisants pour les tâches du site ?",
    "SCALE",
    2,
    true
  );
  const staffingRecommendation = q(
    "Précisez les tâches impactées et les recommandations (recrutement, réorganisation…)",
    "TEXT",
    1,
    true,
    { questionId: staffingSufficient.id, triggerValues: ["rarely", "never"] }
  );
  const socialClimate = q("Un climat social tendu ou un conflit a-t-il été observé ?", "YES_NO", 2, true);
  const socialClimateDetail = q("Détail du conflit constaté et mesures recommandées", "TEXT", 1, true, {
    questionId: socialClimate.id,
    triggerValues: ["yes"],
  });

  const receivablesTracked = q("Les créances clients sont-elles suivies et à jour ?", "SCALE", 2, true);
  const receivablesAmount = q("Montant total des impayés significatifs constatés (DT)", "NUMBER", 1, false);
  const receivablesActionPlan = q("Plan d'action de recouvrement proposé", "TEXT", 1, true, {
    questionId: receivablesTracked.id,
    triggerValues: ["rarely", "never"],
  });

  const machinesOk = q("Les machines et moules sont-ils en bon état de fonctionnement ?", "SCALE", 3, true);
  const machinesDetail = q(
    "Détail des pannes constatées, responsable et plan d'action",
    "TEXT",
    2,
    true,
    { questionId: machinesOk.id, triggerValues: ["rarely", "never"] }
  );
  const wasteRateOk = q(
    "Le taux de rebuts/déchets constaté est-il dans la norme attendue ?",
    "YES_NO",
    2,
    true
  );
  const wasteRateValue = q("Taux de rebuts constaté (%)", "NUMBER", 1, true, {
    questionId: wasteRateOk.id,
    triggerValues: ["no"],
  });

  const cleanlinessOk = q("L'état de propreté du site est-il satisfaisant ?", "SCALE", 1, true);
  const safetyEquipmentOk = q(
    "Les équipements de sécurité (extincteurs, caméras, issues) sont-ils opérationnels et à jour ?",
    "SCALE",
    2,
    true
  );
  const safetyDetail = q(
    "Précisez les anomalies constatées et les actions correctives",
    "TEXT",
    1,
    true,
    { questionId: safetyEquipmentOk.id, triggerValues: ["rarely", "never"] }
  );

  return [
    {
      id: randomUUID(),
      label: "Inventaire stock",
      questions: [stockMatch, stockGap, damagedGoods, damagedGoodsDetail, stockGapCount],
    },
    {
      id: randomUUID(),
      label: "Clôture de caisse (agents commerciaux)",
      questions: [cashGap, cashGapAmount, cashGapJustified, cashGapRegularized],
    },
    {
      id: randomUUID(),
      label: "Facturation et livraison",
      questions: [invoicingBeforeDelivery, invoicingGapDetail, discountValidated],
    },
    {
      id: randomUUID(),
      label: "Organisation et ressources humaines",
      questions: [staffingSufficient, staffingRecommendation, socialClimate, socialClimateDetail],
    },
    {
      id: randomUUID(),
      label: "Suivi balance client et recouvrement",
      questions: [receivablesTracked, receivablesAmount, receivablesActionPlan],
    },
    {
      id: randomUUID(),
      label: "Production et équipements (usine)",
      questions: [machinesOk, machinesDetail, wasteRateOk, wasteRateValue],
    },
    {
      id: randomUUID(),
      label: "Hygiène, sécurité et environnement général",
      questions: [cleanlinessOk, safetyEquipmentOk, safetyDetail],
    },
  ];
}
