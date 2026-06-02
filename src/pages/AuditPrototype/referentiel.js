// Référentiel Qualiopi — données fidèles aux grilles d'audit CertifOpac

export const CAT = { AFC:"Actions de formation", BC:"Bilan de compétences", VAE:"Validation des acquis", CFA:"Apprentissage (CFA)" };
export const CAT_GRILLE = { AFC:"Actions de formation - AFC", BC:"Bilan de Compétences - BC", VAE:"Validation des Acquis - VAE", CFA:"Apprentissage - CFA" };
export const TYP = { INITIAL:"Initial", SURVEILLANCE:"Surveillance", RENOUVELLEMENT:"Renouvellement" };
export const TYP_GRILLE = {
  INITIAL:"Qualiopi - Initial sur site",
  SURVEILLANCE:"Qualiopi - Surveillance à distance",
  RENOUVELLEMENT:"Qualiopi - Renouvellement sur site",
};

export const criteres = [
  {id:1,libelle:"Information du public"},{id:2,libelle:"Conception de l'offre"},
  {id:3,libelle:"Mise en œuvre des prestations"},{id:4,libelle:"Moyens pédagogiques"},
  {id:5,libelle:"Compétences de l'équipe"},{id:6,libelle:"Environnement"},
  {id:7,libelle:"Amélioration continue"},
];

export const questionsPrelim = [
  {cle:"st_oc",libelle:"Sous-traitance : le prestataire réalise-t-il des prestations pour le compte d'un autre organisme de formation ?"},
  {cle:"rncp",libelle:"Mettez-vous en œuvre des prestations conduisant à une certification professionnelle (inscrite au RNCP) ?"},
  {cle:"alternance",libelle:"Réalisez-vous des formations par alternance ?"},
  {cle:"sous_traitance",libelle:"Faites-vous appel à la sous-traitance ou au portage salarial pour réaliser les prestations ?"},
  {cle:"afest",libelle:"Les prestations dispensées au bénéficiaire comprennent-elles des périodes de formation en situation de travail ?"},
  {cle:"indep",libelle:"Êtes-vous prestataire indépendant ? (Vous assurez seul les différentes fonctions)"},
  {cle:"resp_besoin",libelle:"Êtes-vous responsable de l'analyse du besoin du bénéficiaire ?"},
  {cle:"prerequis",libelle:"Y a-t-il des prérequis à respecter afin de réaliser la prestation ?"},
  {cle:"positionnement",libelle:"Êtes-vous responsable de la détermination des conditions d'accès et des procédures de positionnement des prestations réalisées ?"},
  {cle:"foad",libelle:"Réalisez-vous des prestations en tout ou partie à distance ?"},
  {cle:"equipe",libelle:"Une équipe pédagogique existe-t-elle ? (hors prestataire indépendant ou associés)"},
  {cle:"psh",libelle:"Avez-vous déjà accueilli des personnes en situation de handicap ?"},
  {cle:"indic_resultats",libelle:"Diffusez-vous des indicateurs de résultats / de performance ?"},
];

export const indicateurs = [
  {id:1,critere:1,nc:"MAJEURE",attendu:"Donner une information accessible, exhaustive (c'est-à-dire sur l'intégralité des items mentionnés) datée et actualisée.",definition:"Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, durée, modalités et délais d'accès, tarifs, contacts, méthodes mobilisées et modalités d'évaluation, accessibilité aux personnes handicapées.",points:["L'information est accessible au public","L'information est exhaustive : Les prérequis sont présents","L'information est exhaustive : Les objectifs sont présents","L'information est exhaustive : La durée est présente","L'information est exhaustive : les modalités d'accès sont présentes","L'information est exhaustive : Les délais d'accès sont présents","L'information est exhaustive : Les tarifs sont présents","L'information est exhaustive : Les contacts sont présents","L'information est exhaustive : Les méthodes mobilisées sont présentes","L'information est exhaustive : Les modalités d'évaluation sont présentes","L'information est exhaustive : L'accessibilité aux personnes handicapées est présente","L'information est à jour"]},
  {id:2,critere:1,nc:"MINEURE",attendu:"Donner une information chiffrée sur le niveau de performance et d'accomplissement de la prestation.",definition:"Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et des publics accueillis.",points:["Un ou plusieurs indicateurs sont pré identifiés (obligation spécifique nouvel entrant)","Le ou les indicateurs de résultats existent","Le ou les indicateurs de résultats sont adaptés aux prestations mises en œuvre […]","Le ou les indicateurs de résultats sont diffusés"]},
  {id:3,critere:1,nc:"MAJEURE",attendu:"Donner au public une information accessible, exhaustive et actualisée.",definition:"Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d'obtention des certifications préparées, les possibilités de valider un/ou des blocs de compétences, ainsi que sur les équivalences, passerelles, suites de parcours et les débouchés.",points:["L'information est exhaustive et accessible : le taux d'obtention des certifications préparées est présent","L'information est exhaustive et accessible : les possibilités de valider un ou des blocs de compétences sont présents","L'information est exhaustive et accessible : les équivalences et passerelles sont présents","L'information est exhaustive et accessible : les suites de parcours et débouchés sont présentes","Les informations sont actualisées"]},
  {id:4,critere:2,nc:"MAJEURE",attendu:"Démontrer comment le besoin du bénéficiaire est analysé en fonction de la finalité de la prestation.",definition:"Le prestataire analyse le besoin du bénéficiaire en lien avec l'entreprise et/ou le financeur concerné(s).",points:["Le besoin du bénéficiaire est pris en compte dans la conception et l'exécution de la prestation","Le besoin du bénéficiaire est analysé en fonction de la finalité de la prestation","Le besoin du bénéficiaire est analysé en lien avec l'entreprise ou le financeur concerné","L'analyse du besoin est prévue en amont du processus de contractualisation alternant/entreprise","Les situations de handicap et les besoins en compensation sont pris en compte"]},
  {id:5,critere:2,nc:"MAJEURE",attendu:"Démontrer que les objectifs sont opérationnels et évaluables.",definition:"Le prestataire définit les objectifs opérationnels et évaluables de la prestation.",points:["Les objectifs sont définis de façon opérationnelle","Les objectifs sont définis de façon évaluable","Les objectifs sont exprimés en compétences et/ou capacités professionnelles à acquérir et/ou en certifications visées"]},
  {id:6,critere:2,nc:"MAJEURE",attendu:"Démontrer que les contenus et modalités sont adaptés aux objectifs et aux publics.",definition:"Le prestataire adapte les contenus, méthodes et modalités aux publics bénéficiaires.",points:["Le découpage pédagogique est cohérent avec les objectifs","Les méthodes pédagogiques sont justifiées","Les modalités sont adaptées (présentiel/distanciel/mixte)","La situation de handicap est prise en compte dès la conception","Les outils utilisés sont documentés","Le temps pédagogique est cohérent avec les objectifs"]},
  {id:7,critere:2,nc:"MAJEURE",attendu:"Démontrer que le contenu couvre l'intégralité du référentiel de certification visé.",definition:"Lorsque la prestation vise une certification professionnelle, le prestataire en couvre l'intégralité du référentiel (RNCP/RS).",points:["Un tableau de correspondance contenu/référentiel existe","Chaque bloc de compétences est couvert","Une veille sur la version de la fiche RNCP est active","Les modalités d'évaluation sont alignées sur le référentiel","La fiche France Compétences à jour est référencée"]},
  {id:8,critere:2,nc:"MINEURE",attendu:"Démontrer la mise en œuvre de procédures de positionnement et d'évaluation des acquis à l'entrée.",definition:"Le prestataire détermine les procédures de positionnement et d'évaluation des acquis à l'entrée de la prestation.",points:["Une procédure de positionnement écrite est appliquée","L'outil de positionnement est adapté","Une trace écrite existe par bénéficiaire","La décision (admission/refus/adaptation) est documentée","L'information sur l'absence de prérequis est donnée si applicable"]},
  {id:9,critere:3,nc:"MINEURE",attendu:"Informer les publics des conditions de déroulement de la prestation.",definition:"Le prestataire informe les bénéficiaires des modalités et conditions de déroulement avant le démarrage.",points:["Le livret d'accueil est remis avant démarrage","Le règlement intérieur est diffusé","La convocation détaillée est envoyée","Les conditions pratiques sont précisées","La preuve de diffusion est datée"]},
  {id:10,critere:3,nc:"MAJEURE",attendu:"Démontrer la mise en œuvre des moyens d'adaptation à la situation du bénéficiaire.",definition:"Le prestataire adapte le déroulé aux profils, rythmes et besoins individuels.",points:["Des outils de suivi individuel sont mobilisables","Des points d'étape avec ajustements sont documentés","Un soutien individualisé est activable","Les supports sont adaptés","Les modifications de parcours sont tracées","Le référent handicap est mobilisable"]},
  {id:11,critere:3,nc:"MAJEURE",attendu:"Démontrer la mise en œuvre de modalités d'évaluation des acquis.",definition:"Le prestataire évalue l'atteinte des objectifs par les bénéficiaires.",points:["Les modalités d'évaluation sont cohérentes avec les objectifs","Des évaluations intermédiaires et/ou finales sont prévues","Les grilles d'évaluation sont remplies et signées","La traçabilité est individuelle","Les résultats sont restitués au bénéficiaire","La validation/non-validation est tracée et motivée"]},
  {id:12,critere:3,nc:"MINEURE",attendu:"Décrire et mettre en œuvre les mesures pour favoriser l'assiduité et prévenir les abandons.",definition:"Le prestataire suit l'assiduité, prévient et trace les abandons.",points:["Un outil de suivi d'assiduité existe","Une procédure de relance est appliquée","Les relances sont documentées","Un registre des abandons avec motifs est tenu","Des mesures de remédiation sont proposées"]},
  {id:13,critere:3,nc:"MAJEURE",attendu:"Démontrer que les principes de la pédagogie de l'alternance sont mis en œuvre, grâce à un processus formalisé d'articulation itératif des apprentissages entre le centre de formation et l'entreprise.",definition:"Pour les formations en alternance, le prestataire, en lien avec l'entreprise anticipe avec l'apprenant les missions confiées, à court, moyen et long terme, et assure la coordination et la progressivité des apprentissages réalisés en centre de formation et en entreprise.",points:["Un processus formalisé d'articulation itératif des apprentissages est formalisé pour les deux lieux de formation : en centre de formation et en entreprise.","Le processus formalisé d'articulation itératif des apprentissages est mis en œuvre."]},
  {id:14,critere:3,nc:"MINEURE",attendu:"Démontrer la mise en œuvre d'un accompagnement social et professionnel des apprentis.",definition:"Le CFA accompagne les apprentis sur les freins extra-pédagogiques (logement, transport, santé).",points:["Les freins extra-pédagogiques sont identifiés","Les aides apprentis sont mobilisées","Des partenariats existent (CROUS, CAF...)","Un référent social dédié est identifié","Des traces d'accompagnement existent"]},
  {id:15,critere:3,nc:"MINEURE",attendu:"Démontrer la sensibilisation des apprentis à leurs droits et devoirs et aux valeurs républicaines.",definition:"Le CFA sensibilise l'apprenti à ses droits et devoirs ainsi qu'aux valeurs de la République.",points:["Sensibilisation aux droits/devoirs des apprentis","Sensibilisation aux valeurs républicaines","Un module citoyenneté est intégré au parcours","Des traces de sensibilisation existent","Des supports écrits sont remis"]},
  {id:16,critere:3,nc:"MAJEURE",attendu:"Respecter les exigences formelles d'évaluation du certificateur.",definition:"Pour les prestations certifiantes, le prestataire respecte les exigences du certificateur pour l'épreuve finale ou de validation.",points:["Le règlement d'examen du certificateur est respecté","La convocation aux examens est conforme","La composition du jury est conforme","Le PV de session est signé et archivé","Les aménagements PSH sont prévus et documentés"]},
  {id:17,critere:4,nc:"MAJEURE",attendu:"Démontrer l'adéquation des moyens humains, techniques et de l'environnement aux prestations.",definition:"Le prestataire mobilise des moyens humains et techniques adaptés et un environnement approprié.",points:["Les locaux sont justifiés (bail, propriété, location)","L'attestation de conformité ERP existe si accueil du public","L'inventaire du matériel pédagogique existe","L'organigramme et les CV de l'équipe sont disponibles","L'environnement est adapté (confidentialité BC)"]},
  {id:18,critere:4,nc:"MINEURE",attendu:"Démontrer la coordination de l'équipe pédagogique.",definition:"Le prestataire coordonne les personnes contribuant à la réalisation des prestations.",points:["L'organigramme fonctionnel est à jour","Les fiches de poste/contrats existent par intervenant","Des CR de réunions pédagogiques existent","Des outils de coordination sont utilisés","La sous-traitance est encadrée le cas échéant"]},
  {id:19,critere:4,nc:"MAJEURE",attendu:"Démontrer la qualité pédagogique des prestations FOAD et présentielles.",definition:"Le prestataire mobilise et coordonne les ressources adaptées aux modalités (FOAD, présentiel).",points:["La plateforme est accessible, stable et sécurisée (FOAD)","Une assistance technique est disponible","Le suivi synchrone/asynchrone est précisé","Les traces des connexions existent","L'émargement par demi-journée existe (présentiel)","La salle et le matériel sont vérifiés (présentiel)"]},
  {id:20,critere:4,nc:"MINEURE",attendu:"Démontrer l'encouragement et l'organisation de la mobilité des apprentis.",definition:"Le CFA favorise la mobilité nationale et internationale des apprentis.",points:["Un référent mobilité est nommé","Des contacts Erasmus+/Région existent","Des ateliers d'information sont organisés","Les opportunités sont affichées","Le suivi des mobilités est documenté"]},
  {id:21,critere:5,nc:"MAJEURE",attendu:"Démontrer que les intervenants disposent des compétences et qualifications requises.",definition:"Le prestataire détermine et mobilise les compétences requises pour les prestations.",points:["Un CV à jour existe par intervenant","Les diplômes/titres sont joints","L'expérience professionnelle est documentée","L'adéquation profil/prestation est visible","Une matrice « qui forme sur quoi » est à jour","Les sous-traitants sont documentés à l'identique"]},
  {id:22,critere:5,nc:"MINEURE",attendu:"Démontrer le maintien et le développement des compétences de l'équipe.",definition:"Le prestataire entretient et développe les compétences de ses intervenants.",points:["Un Plan de Développement des Compétences existe","Des attestations de formations sont collectées","Les entretiens professionnels sont tenus (salariés)","La veille/auto-formation est tracée","Les sous-traitants fournissent une attestation annuelle"]},
  {id:23,critere:6,nc:"MINEURE",attendu:"Démontrer la réalisation d'une veille légale et réglementaire et son exploitation.",definition:"Le prestataire réalise une veille légale et réglementaire et en exploite les résultats.",points:["Les sources de veille sont identifiées","Un tableau de veille daté existe","La colonne « impact sur prestations » est remplie","La périodicité est définie","La diffusion à l'équipe est formalisée"]},
  {id:24,critere:6,nc:"MINEURE",attendu:"Démontrer la veille sur les compétences, métiers et emplois et son exploitation.",definition:"Le prestataire réalise une veille sur l'évolution des métiers et compétences.",points:["Des sources spécialisées sont identifiées","Le suivi des fiches RNCP/RS est assuré","Un tableau de veille avec impact existe","Un lien avec les observatoires existe","L'exploitation est tracée"]},
  {id:25,critere:6,nc:"MINEURE",attendu:"Démontrer la veille pédagogique et l'innovation et son exploitation.",definition:"Le prestataire réalise une veille sur les innovations pédagogiques.",points:["Des sources de veille pédagogique existent","Le suivi des LMS/outils est assuré","Un tableau de veille avec impact existe","Un test ou intégration d'outils est tracé","La diffusion à l'équipe est formalisée"]},
  {id:26,critere:6,nc:"MAJEURE",attendu:"Démontrer la mobilisation du réseau handicap et des mesures d'accueil.",definition:"Le prestataire mobilise les ressources et le réseau pour l'accueil des personnes en situation de handicap.",points:["Un référent handicap est nommé et diffusé","Un réseau de partenaires est identifié","Une liste de contacts régionalisée est à jour","Les modalités de recours sont précisées","Des mesures spécifiques sont formalisées"]},
  {id:27,critere:6,nc:"MINEURE",attendu:"Démontrer que les sous-traitants respectent les exigences Qualiopi.",definition:"Le prestataire s'assure du respect des exigences par les sous-traitants/portés salariaux.",points:["Un contrat de sous-traitance avec clause Qualiopi existe","Le certificat Qualiopi du ST est vérifié (si CPF)","Une procédure d'évaluation des ST existe","Un suivi périodique de la qualité ST est assuré","L'exception micro-entrepreneur est documentée si invoquée"]},
  {id:28,critere:6,nc:"MINEURE",attendu:"Démontrer la structuration de l'ingénierie AFEST.",definition:"Lorsque la formation comprend de l'AFEST, le prestataire en structure l'ingénierie.",points:["Une analyse préalable de l'activité de travail existe","Un tuteur en entreprise est désigné","Un protocole individuel signé existe","Les phases d'apprentissage et réflexives sont tracées","L'évaluation des acquis est intégrée à l'AFEST"]},
  {id:29,critere:6,nc:"MAJEURE",attendu:"Démontrer la mesure et l'amélioration de l'insertion des apprentis sortants.",definition:"Le CFA mesure l'insertion professionnelle des apprentis et met en place des actions d'amélioration.",points:["Une enquête d'insertion à N+6/N+12 existe","Le taux d'insertion est calculé et publié","Les données InserJeunes sont consultées/publiées","Une analyse des écarts entre promotions existe","Des actions correctrices existent si taux insuffisants"]},
  {id:30,critere:7,nc:"MINEURE",attendu:"Démontrer le recueil régulier des appréciations des parties prenantes.",definition:"Le prestataire recueille les appréciations des bénéficiaires et parties prenantes.",points:["Des modèles d'enquêtes formalisés existent (chaud/froid)","La diffusion est systématique en fin de prestation","Le taux de retour est suivi et analysé","Une synthèse des résultats est produite","Des enquêtes parties prenantes existent si pertinent"]},
  {id:31,critere:7,nc:"MINEURE",attendu:"Démontrer une procédure de traitement des réclamations affichée et appliquée.",definition:"Le prestataire met en œuvre des modalités de traitement des difficultés et réclamations.",points:["Une procédure de gestion écrite existe","La procédure est affichée et accessible","Un formulaire de réclamation est disponible","Un registre de suivi est tenu","Un accusé de réception et une réponse formelle sont envoyés"]},
  {id:32,critere:7,nc:"MAJEURE",attendu:"Démontrer la mise en œuvre de mesures d'amélioration continue.",definition:"Le prestataire met en œuvre des mesures d'amélioration à partir de l'analyse des appréciations et réclamations.",points:["Un processus d'amélioration continue est formalisé","Un plan d'amélioration (PAC/PAQ) daté et révisé existe","Des comptes-rendus de réunions qualité existent","Des preuves d'actions correctives existent","CFA : un PV du Conseil de Perfectionnement existe"]},
];

const T="TOUJOURS", C="CONDITIONNEL", N="JAMAIS";
export const matrice = {
  1:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  2:{AFC:[T],BC:[N],VAE:[T],CFA:[T]},
  3:{AFC:[C,"rncp"],BC:[N],VAE:[C,"rncp"],CFA:[C,"rncp"]},
  4:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},5:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},6:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  7:{AFC:[C,"rncp"],BC:[N],VAE:[C,"rncp"],CFA:[C,"rncp"]},
  8:{AFC:[T],BC:[N],VAE:[T],CFA:[T]},
  9:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},10:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  11:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},12:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  13:{AFC:[N],BC:[N],VAE:[N],CFA:[T]},14:{AFC:[N],BC:[N],VAE:[N],CFA:[T]},15:{AFC:[N],BC:[N],VAE:[N],CFA:[T]},
  16:{AFC:[C,"rncp"],BC:[N],VAE:[C,"rncp"],CFA:[C,"rncp"]},
  17:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  18:{AFC:[C,"equipe"],BC:[C,"equipe"],VAE:[C,"equipe"],CFA:[T]},
  19:{AFC:[C,"foad"],BC:[C,"foad"],VAE:[C,"foad"],CFA:[C,"foad"]},
  20:{AFC:[N],BC:[N],VAE:[N],CFA:[T]},
  21:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},22:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  23:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},24:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},25:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  26:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  27:{AFC:[C,"sous_traitance"],BC:[C,"sous_traitance"],VAE:[C,"sous_traitance"],CFA:[C,"sous_traitance"]},
  28:{AFC:[C,"afest"],BC:[N],VAE:[N],CFA:[C,"afest"]},
  29:{AFC:[N],BC:[N],VAE:[N],CFA:[T]},
  30:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},31:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},32:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
};

export function applicabilite(categorie, rep) {
  return indicateurs.map((ind) => {
    const [s,k] = matrice[ind.id][categorie];
    if (s===T) return { ind, applicable:true };
    if (s===N) return { ind, applicable:false };
    return { ind, applicable: rep?.[k]===true };
  });
}

export function syntheseAvis(maj, min) {
  if (maj>=1 || min>=5) return { cle:"DEFAVORABLE", label:"Défavorable", couleur:"#dc2626",
    txt:"Ne peut pas obtenir la certification tant que les non-conformités ne sont pas levées dans les 3 mois." };
  if (min>=1) return { cle:"RESERVE", label:"Réservé", couleur:"#ea580c",
    txt:"Obtient la certification, maintenue sous réserve de lever les non-conformités dans les 6 mois ou lors de l'audit de surveillance." };
  return { cle:"FAVORABLE", label:"Favorable", couleur:"#16a34a",
    txt:"Obtient la certification de plein droit, sans aucune réserve." };
}
