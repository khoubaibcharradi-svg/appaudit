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

function section(label: string, questions: QuestionDef[]): SectionDef {
  return { id: randomUUID(), label, questions };
}

/**
 * Standard starting point for usine audits, built from the recurring
 * findings across the S2I audit reports (suivi CA, ordres de fabrication,
 * machines/moules, matières premières, rebuts, recouvrement, RH, hygiène
 * et sécurité). Admins duplicate this template and adjust it rather than
 * starting blank for every usine visit.
 */
export function buildUsineStandardSections(): SectionDef[] {
  const caEvolution = q(
    "L'évolution du chiffre d'affaires du mois est-elle conforme aux objectifs ?",
    "SCALE",
    2,
    true
  );
  const caEvolutionDetail = q(
    "Précisez les écarts constatés et leurs causes (perte de clients, nouveaux clients…)",
    "TEXT",
    1,
    true,
    { questionId: caEvolution.id, triggerValues: ["rarely", "never"] }
  );
  const topClientsRisk = q("Des clients majeurs ont-ils réduit ou arrêté leurs commandes ?", "YES_NO", 2, true);
  const topClientsDetail = q(
    "Précisez les clients concernés et le plan d'action commercial",
    "TEXT",
    1,
    true,
    { questionId: topClientsRisk.id, triggerValues: ["yes"] }
  );

  const ofConformity = q(
    "Les ordres de fabrication et bons de sortie matière première sont-ils tous enregistrés et cohérents ?",
    "SCALE",
    3,
    true
  );
  const ofGapDetail = q(
    "Précisez les écarts ou retards de saisie constatés et la cause (absence, surcharge…)",
    "TEXT",
    2,
    true,
    { questionId: ofConformity.id, triggerValues: ["rarely", "never"] }
  );

  const machinesState = q("Les machines et moules sont-ils en bon état de fonctionnement ?", "SCALE", 3, true);
  const machinesDetail = q(
    "Détail des pannes constatées (machine, pièce, durée) et plan d'action",
    "TEXT",
    2,
    true,
    { questionId: machinesState.id, triggerValues: ["rarely", "never"] }
  );
  const machinesStoppedCount = q("Nombre de machines à l'arrêt lors de la visite", "NUMBER", 1, false);

  const mpMatch = q("Le stock physique de matières premières correspond-il aux données système ?", "YES_NO", 3, true);
  const mpGapDetail = q("Précisez les articles et quantités en écart", "TEXT", 2, true, {
    questionId: mpMatch.id,
    triggerValues: ["no"],
  });

  const wasteRateOk = q("Le taux de rebuts constaté est-il dans la norme attendue ?", "YES_NO", 2, true);
  const wasteRateValue = q("Taux de rebuts constaté (%)", "NUMBER", 1, true, {
    questionId: wasteRateOk.id,
    triggerValues: ["no"],
  });
  const wasteSalesTracked = q(
    "Le stock de déchets à vendre est-il suivi et écoulé régulièrement ?",
    "SCALE",
    1,
    true
  );

  const receivablesTracked = q("Les créances clients sont-elles suivies et à jour ?", "SCALE", 2, true);
  const receivablesAmount = q("Montant total des impayés significatifs constatés (DT)", "NUMBER", 1, false);
  const receivablesPlan = q("Plan d'action de recouvrement proposé", "TEXT", 1, true, {
    questionId: receivablesTracked.id,
    triggerValues: ["rarely", "never"],
  });

  const staffingOk = q("Les effectifs (production, administratif) sont-ils suffisants ?", "SCALE", 2, true);
  const staffingDetail = q(
    "Précisez les postes en tension et les recommandations",
    "TEXT",
    1,
    true,
    { questionId: staffingOk.id, triggerValues: ["rarely", "never"] }
  );
  const socialConflict = q("Un conflit ou climat social tendu a-t-il été observé ?", "YES_NO", 2, true);
  const socialConflictDetail = q("Détail du conflit constaté et mesures recommandées", "TEXT", 1, true, {
    questionId: socialConflict.id,
    triggerValues: ["yes"],
  });

  const cleanlinessOk = q("L'état de propreté de l'usine est-il satisfaisant ?", "SCALE", 1, true);
  const safetyEquipmentOk = q(
    "Les équipements de sécurité (extincteurs, caméras) sont-ils opérationnels et à jour ?",
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
  const itEquipmentOk = q(
    "Le matériel informatique (postes, imprimantes) est-il suffisant et fonctionnel ?",
    "SCALE",
    1,
    true
  );

  return [
    section("Ventes et chiffre d'affaires", [caEvolution, caEvolutionDetail, topClientsRisk, topClientsDetail]),
    section("Ordres de fabrication et sorties matière", [ofConformity, ofGapDetail]),
    section("État des machines et moules", [machinesState, machinesDetail, machinesStoppedCount]),
    section("Inventaire matières premières", [mpMatch, mpGapDetail]),
    section("Rebuts et déchets", [wasteRateOk, wasteRateValue, wasteSalesTracked]),
    section("Suivi balance client et recouvrement", [receivablesTracked, receivablesAmount, receivablesPlan]),
    section("Organisation et climat social", [staffingOk, staffingDetail, socialConflict, socialConflictDetail]),
    section("Hygiène, sécurité et environnement usine", [
      cleanlinessOk,
      safetyEquipmentOk,
      safetyDetail,
      itEquipmentOk,
    ]),
  ];
}

/**
 * Standard starting point for dépôt audits, built from the recurring
 * findings across the Jendouba/Sfax/Sousse dépôt audit reports (inventaire
 * PROXIM/PROMOFOOD/BEESKY, clôture de caisse, facturation, retours
 * clients, organisation, recouvrement et effets).
 */
export function buildDepotStandardSections(): SectionDef[] {
  const stockMatch = q(
    "Le stock physique correspond-il au stock système (PROXIM/PROMOFOOD/BEESKY) ?",
    "YES_NO",
    3,
    true
  );
  const stockGapDetail = q(
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
  const traceabilityOk = q(
    "Les mouvements de stock (transferts entre dépôts, gestes commerciaux) sont-ils tracés formellement ?",
    "SCALE",
    2,
    true
  );
  const traceabilityDetail = q(
    "Précisez les manques de traçabilité constatés",
    "TEXT",
    1,
    true,
    { questionId: traceabilityOk.id, triggerValues: ["rarely", "never"] }
  );

  const cashGap = q(
    "Un écart a-t-il été constaté entre le système (NOMADIS) et les espèces encaissées ?",
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
  const vehicleStockGap = q(
    "Un écart a-t-il été constaté lors de l'inventaire du stock véhicule ?",
    "YES_NO",
    2,
    true
  );
  const vehicleStockDetail = q("Montant/quantité de l'écart et régularisation effectuée", "TEXT", 1, true, {
    questionId: vehicleStockGap.id,
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
  const returnsProcessOk = q(
    "Les retours clients sont-ils traités selon la procédure (déclaration, validation direction) ?",
    "SCALE",
    2,
    true
  );
  const returnsProcessDetail = q(
    "Précisez les retours en attente et l'origine du blocage",
    "TEXT",
    1,
    true,
    { questionId: returnsProcessOk.id, triggerValues: ["rarely", "never"] }
  );

  const staffingSufficient = q(
    "Les effectifs administratifs sont-ils suffisants pour les tâches du dépôt ?",
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
  const orgChartClear = q("Un organigramme clair et une répartition des tâches sont-ils en place ?", "YES_NO", 1, true);

  const receivablesTracked = q("Les créances clients sont-elles suivies et à jour ?", "SCALE", 2, true);
  const receivablesAmount = q("Montant total des impayés significatifs constatés (DT)", "NUMBER", 1, false);
  const receivablesPlan = q("Plan d'action de recouvrement proposé", "TEXT", 1, true, {
    questionId: receivablesTracked.id,
    triggerValues: ["rarely", "never"],
  });
  const effectsManagementOk = q(
    "La gestion des effets (traites, échéances) est-elle rigoureuse et à jour ?",
    "SCALE",
    1,
    true
  );

  return [
    section("Inventaire stock dépôt", [
      stockMatch,
      stockGapDetail,
      damagedGoods,
      damagedGoodsDetail,
      traceabilityOk,
      traceabilityDetail,
    ]),
    section("Clôture de caisse et inventaire véhicule (agents commerciaux)", [
      cashGap,
      cashGapAmount,
      cashGapJustified,
      cashGapRegularized,
      vehicleStockGap,
      vehicleStockDetail,
    ]),
    section("Facturation, livraison et retours clients", [
      invoicingBeforeDelivery,
      invoicingGapDetail,
      discountValidated,
      returnsProcessOk,
      returnsProcessDetail,
    ]),
    section("Organisation et ressources humaines", [staffingSufficient, staffingRecommendation, orgChartClear]),
    section("Suivi balance client, recouvrement et effets", [
      receivablesTracked,
      receivablesAmount,
      receivablesPlan,
      effectsManagementOk,
    ]),
  ];
}
