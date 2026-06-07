import React, { useState, useMemo, useRef, useEffect } from "react";

// Couleurs CertifOpac (utilisées dans tout le composant)
const C_BLEU = "#1d6fb8";   // bleu des titres
const C_TEAL = "#17b8a6";   // teal "Conforme"
const C_ROND = "#17b8a6";   // ronds cochés

// Référentiel Qualiopi — données fidèles aux grilles d'audit CertifOpac

const CAT = { AFC:"Actions de formation", BC:"Bilan de compétences", VAE:"Validation des acquis", CFA:"Apprentissage (CFA)" };
const CAT_GRILLE = { AFC:"Actions de formation - AFC", BC:"Bilan de Compétences - BC", VAE:"Validation des Acquis - VAE", CFA:"Apprentissage - CFA" };
const TYP = { INITIAL:"Initial", SURVEILLANCE:"Surveillance", RENOUVELLEMENT:"Renouvellement" };
const TYP_GRILLE = {
  INITIAL:"Qualiopi - Initial sur site",
  SURVEILLANCE:"Qualiopi - Surveillance à distance",
  RENOUVELLEMENT:"Qualiopi - Renouvellement sur site",
};

const criteres = [
  {id:1,libelle:"Information du public"},{id:2,libelle:"Conception de l'offre"},
  {id:3,libelle:"Mise en œuvre des prestations"},{id:4,libelle:"Moyens pédagogiques"},
  {id:5,libelle:"Compétences de l'équipe"},{id:6,libelle:"Environnement"},
  {id:7,libelle:"Amélioration continue"},
];

const questionsPrelim = [
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

const indicateurs = [
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
const matrice = {
  1:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
  2:{AFC:[T],BC:[T],VAE:[T],CFA:[T]},
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

function applicabilite(categorie, rep) {
  return indicateurs.map((ind) => {
    const [s,k] = matrice[ind.id][categorie];
    if (s===T) return { ind, applicable:true };
    if (s===N) return { ind, applicable:false };
    return { ind, applicable: rep?.[k]===true };
  });
}

function syntheseAvis(maj, min) {
  if (maj>=1 || min>=5) return { cle:"DEFAVORABLE", label:"Défavorable", couleur:"#dc2626",
    txt:"Ne peut pas obtenir la certification tant que les non-conformités ne sont pas levées dans les 3 mois." };
  if (min>=1) return { cle:"RESERVE", label:"Réservé", couleur:"#ea580c",
    txt:"Obtient la certification, maintenue sous réserve de lever les non-conformités dans les 6 mois ou lors de l'audit de surveillance." };
  return { cle:"FAVORABLE", label:"Favorable", couleur:"#16a34a",
    txt:"Obtient la certification de plein droit, sans aucune réserve." };
}


import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'
import StatusModal from '../../components/shared/StatusModal'
import Logo from '../../components/Logo'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export default function AuditQualiopi() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [org, setOrg] = useState({
    auditeurNom:"", auditeurNum:"", auditeurTel:"",
    auditeurMail:"",
    orgNom:"", orgNum:"", orgVille:"", orgCA:"",
    auditNum:"", dateDeb:"", dateFin:"", site:"Monosite",
    contactNom:"", contactMail:"", contactTel:"",
    presentation:"", prestations:"", echantillon:"", pointsForts:"", commentaire:"",
  });

  // Sélections CUMULATIVES
  const [cats, setCats] = useState([]);    // ex: ['AFC','BC']
  const [types, setTypes] = useState([]);  // ex: ['INITIAL','SURVEILLANCE']

  // Grilles générées : [{id, cat, type}]
  const [grilles, setGrilles] = useState([]);
  const [activeG, setActiveG] = useState(null);
  // données par grille : { [gid]: { rep:{}, pts:{}, dec:{}, proc:{}, preuve:{}, ecart:{} } }
  const [data, setData] = useState({});
  const gid = useRef(1);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "success" });

  useEffect(() => {
    if (!id || !user) return;
    const fetchAudit = async () => {
      setIsLoading(true);
      try {
        const { data: audit, error } = await supabase
          .from('qualiopi_audits')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (audit) {
          setOrg(audit.org_data || {});
          setCats(audit.cats || []);
          setTypes(audit.types || []);
          setGrilles(audit.grilles || []);
          setData(audit.grid_data || {});
          
          if (audit.grilles && audit.grilles.length > 0) {
            setActiveG(audit.grilles[0].id);
            const maxId = Math.max(...audit.grilles.map(g => g.id), 0);
            gid.current = maxId + 1;
          }
        }
      } catch (err) {
        console.error("Erreur de chargement de l'audit:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudit();
  }, [id, user]);

  const handleSave = async () => {
    if (!user) return;
    
    // Validation des champs
    const requiredFields = [
      'auditeurNom', 'auditeurNum', 'orgNom', 'orgNum', 
      'orgVille', 'orgCA', 'auditNum', 'dateDeb', 'dateFin', 
      'contactNom', 'contactMail'
    ];
    
    const isMissingFields = requiredFields.some(field => !org[field] || org[field].trim() === '');
    
    if (isMissingFields || cats.length === 0 || types.length === 0 || grilles.length === 0) {
      setModal({ 
        isOpen: true, 
        title: "Champs obligatoires", 
        message: "Veuillez remplir tous les champs de l'en-tête et générer au moins une grille d'audit avant de sauvegarder.", 
        type: "warning" 
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        consultant_id: user.id,
        org_data: org,
        cats,
        types,
        grilles,
        grid_data: data,
        updated_at: new Date().toISOString()
      };

      if (id) {
        const { error } = await supabase
          .from('qualiopi_audits')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        setModal({ isOpen: true, title: "Enregistré !", message: "Les informations ont été sauvegardées et votre consultant a été notifié.", type: "success" });
      } else {
        const { data: newAudit, error } = await supabase
          .from('qualiopi_audits')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setModal({ isOpen: true, title: "Enregistré !", message: "Les informations ont été sauvegardées et votre consultant a été notifié.", type: "success" });
        navigate(`/consultant/audit/${newAudit.id}`);
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      setModal({ isOpen: true, title: "Erreur", message: "Erreur lors de la sauvegarde.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (arr, set, val) =>
    set(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]);

  const genererGrilles = () => {
    const nouvelles = [];
    const next = { ...data };
    cats.forEach(cat => types.forEach(type => {
      const exists = grilles.some(g=>g.cat===cat&&g.type===type);
      if (!exists) {
        const id = gid.current++;
        nouvelles.push({ id, cat, type });
        next[id] = { rep:{}, pts:{}, dec:{}, proc:{}, preuve:{}, ecart:{} };
      }
    }));
    if (nouvelles.length) {
      const all = [...grilles, ...nouvelles];
      setGrilles(all);
      setData(next);
      setActiveG(nouvelles[0].id);
    }
  };
  const rmGrille = (id) => {
    const next = grilles.filter(g=>g.id!==id);
    setGrilles(next);
    if (activeG===id) setActiveG(next[0]?.id ?? null);
  };

  const G = grilles.find(g=>g.id===activeG);
  const gd = activeG!=null ? data[activeG] : null;
  const applic = useMemo(()=> G ? applicabilite(G.cat, gd?.rep) : [], [G, gd?.rep]);

  const setGD = (patch) => setData(d=>({ ...d, [activeG]: { ...d[activeG], ...patch } }));

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
      <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <ConsultantTopBar
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          showSearch={false}
        />
        <div style={{...s.app, minHeight: 'auto', flex: 1, width: '100%'}}>
      <style>{CSS}</style>

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText="OK"
        customTheme={{ primary: "#6f32be", light: "#f3e8ff" }}
      />

      <div style={s.shell}>
        {/* ============ BLOC PARAMÉTRAGE ============ */}
        <div style={s.config}>
          <div style={{...s.configHead, justifyContent: "space-between"}}>
            <div style={{display:"flex", alignItems:"center", gap:12}}>
              <Logo size="small" color="purple" iconOnly={true} />
              <div>
                <div style={{fontWeight:700,fontSize:15}}>Easy'Qual — Audit Qualiopi</div>
                <div style={{fontSize:12,color:"#7a7a85"}}>Paramétrez la mission, puis générez les grilles d'audit</div>
              </div>
            </div>
            <div>
              <button 
                onClick={handleSave} 
                disabled={isSaving || isLoading}
                className="bg-[#6f32be] hover:bg-[#5b2899] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Chargement..." : isSaving ? "Sauvegarde en cours..." : "Sauvegarder l'audit"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
            <F l="Auditeur"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.auditeurNom} onChange={e=>setOrg({...org,auditeurNom:e.target.value})}/></F>
            <F l="N° auditeur"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.auditeurNum} onChange={e=>setOrg({...org,auditeurNum:e.target.value})}/></F>
            <F l="Organisme audité"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.orgNom} onChange={e=>setOrg({...org,orgNom:e.target.value})}/></F>
            <F l="N° organisme"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.orgNum} onChange={e=>setOrg({...org,orgNum:e.target.value})}/></F>
            <F l="Ville"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.orgVille} onChange={e=>setOrg({...org,orgVille:e.target.value})}/></F>
            <F l="Tranche CA"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.orgCA} onChange={e=>setOrg({...org,orgCA:e.target.value})}/></F>
            <F l="N° audit"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.auditNum} onChange={e=>setOrg({...org,auditNum:e.target.value})}/></F>
            <F l="Date début"><input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.dateDeb} onChange={e=>setOrg({...org,dateDeb:e.target.value})}/></F>
            <F l="Date fin"><input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.dateFin} onChange={e=>setOrg({...org,dateFin:e.target.value})}/></F>
            <F l="Contact"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.contactNom} onChange={e=>setOrg({...org,contactNom:e.target.value})}/></F>
            <F l="Email contact"><input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold" value={org.contactMail} onChange={e=>setOrg({...org,contactMail:e.target.value})}/></F>
            <F l="Site"><select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm font-semibold" value={org.site} onChange={e=>setOrg({...org,site:e.target.value})}><option>Monosite</option><option>Multisite</option></select></F>
          </div>

          <div style={s.cfgRow}>
            <div style={{flex:1}}>
              <div style={s.cfgLbl}>Catégories d'action <span style={s.hint}>(cumulables)</span></div>
              <div style={s.pillRow}>
                {Object.entries(CAT).map(([k,v])=>(
                  <button key={k} onClick={()=>toggle(cats,setCats,k)}
                    style={cats.includes(k)?s.pillOn:s.pill} title={v}>
                    {cats.includes(k)&&<span style={s.check}>✓</span>}{k}
                  </button>
                ))}
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={s.cfgLbl}>Types d'audit <span style={s.hint}>(cumulables)</span></div>
              <div style={s.pillRow}>
                {Object.entries(TYP).map(([k,v])=>(
                  <button key={k} onClick={()=>toggle(types,setTypes,k)}
                    style={types.includes(k)?s.pillOn:s.pill}>
                    {types.includes(k)&&<span style={s.check}>✓</span>}{v}
                  </button>
                ))}
              </div>
            </div>
            <button style={s.genBtn}
              disabled={!cats.length||!types.length}
              onClick={genererGrilles}>
              Générer {cats.length&&types.length?`${cats.length*types.length} `:""}grille(s)
            </button>
          </div>

          {grilles.length>0 && (
            <div style={s.tabsWrap}>
              <div style={{fontSize:11,color:"#9a9aa3",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:.4}}>Grilles d'audit générées</div>
              <div style={s.tabs}>
                {grilles.map(g=>{
                  const d=data[g.id];
                  const ap=applicabilite(g.cat,d?.rep);
                  let maj=0,min=0;
                  ap.forEach(a=>{if(a.applicable){const dc=d?.dec[a.ind.id];if(dc==="NON_CONFORME"){if(a.ind.nc==="MAJEURE")maj++;else min++;}}});
                  const av=syntheseAvis(maj,min);
                  const on=g.id===activeG;
                  return (
                    <div key={g.id} onClick={()=>setActiveG(g.id)}
                      style={on?s.tabOn:s.tab}>
                      <span style={{width:8,height:8,borderRadius:9,background:av.couleur,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:600}}>{g.cat} · {TYP[g.type]}</span>
                      <button style={s.tabX} onClick={e=>{e.stopPropagation();rmGrille(g.id);}}>×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ============ GRILLE ACTIVE (rendu fidèle document) ============ */}
        {!G ? (
          <div style={s.empty}>
            <div style={{fontSize:38,opacity:.2}}>▦</div>
            <div style={{fontWeight:600,marginTop:8}}>Aucune grille générée</div>
            <div style={{fontSize:13,color:"#8a8a92",marginTop:4,maxWidth:480,lineHeight:1.6}}>
              Cochez une ou plusieurs catégories et un ou plusieurs types d'audit,
              puis « Générer les grilles ». Chaque combinaison produit une grille d'audit
              complète, navigable via les onglets ci-dessus.
            </div>
          </div>
        ) : (
          <Grille org={org} G={G} gd={gd} applic={applic} setGD={setGD}/>
        )}
      </div>
    </div>
    </div>
    </div>
  );
}

/* ====== EN-TÊTE répété (identique au document) ====== */
function Entete({ org, G }) {
  return (
    <div style={s.entete}>
      <div style={s.col}>
        <div style={s.colLabel}>Auditeur #{org.auditeurNum}</div>
        <div style={s.colStrong}>{org.auditeurNom}</div>
        <div style={s.colTxt}>{org.auditeurTel}</div>
        <div style={s.colTxt}>{org.auditeurMail}</div>
      </div>
      <div style={s.col}>
        <div style={s.colLabel}>Organisme #{org.orgNum}</div>
        <div style={s.colStrong}>{org.orgNom}</div>
        <div style={s.colTxt}>{org.orgVille}</div>
        <div style={s.colTxt}>{org.orgCA}</div>
      </div>
      <div style={s.col}>
        <div style={s.colLabel}>Audit #{org.auditNum}</div>
        <div style={s.colStrong}>{TYP_GRILLE[G.type]}</div>
        <div style={s.colStrong}>Categorie: {G.cat}</div>
        <div style={s.colTxt}>{org.dateDeb} / {org.dateFin}</div>
        <div style={s.colTxt}>{org.site}</div>
      </div>
      <div style={s.col}>
        <div style={s.colLabel}>Contact</div>
        <div style={s.colStrong}>{org.contactNom}</div>
        <div style={s.colTxt}>{org.contactMail}</div>
        <div style={s.colTxt}>{org.contactTel}</div>
      </div>
      <div style={s.badge}>
        <div style={{fontSize:22}}>🗎</div>
        <div style={{color:C_BLEU,fontWeight:700,fontSize:12}}>Réalisé</div>
      </div>
    </div>
  );
}

/* ====== UNE GRILLE D'AUDIT (fidèle au document) ====== */
function Grille({ org, G, gd, applic, setGD }) {
  const qs = useMemo(()=> {
    const set=new Set();
    indicateurs.forEach(i=>{
      const m=matrice[i.id][G.cat];
      if(m[0]==="CONDITIONNEL"&&m[1])set.add(m[1]);
    });
    return questionsPrelim;
  }, [G.cat]);

  const setRep = (k,v)=>setGD({ rep:{...gd.rep,[k]:v} });
  const setPt = (id,i,v)=>setGD({ pts:{...gd.pts,[id]:{...(gd.pts[id]||{}),[i]:v}} });
  const setDec = (id,v)=>setGD({ dec:{...gd.dec,[id]:v} });
  const setProc = (id,v)=>setGD({ proc:{...gd.proc,[id]:v} });
  const setPreuve = (id,v)=>setGD({ preuve:{...gd.preuve,[id]:v} });

  let maj=0,min=0;
  applic.forEach(a=>{if(a.applicable){const d=gd.dec[a.ind.id];if(d==="NON_CONFORME"){if(a.ind.nc==="MAJEURE")maj++;else min++;}}});
  const totalPages = applic.filter(a=>a.applicable).length + 4;
  let pageNo = 0;

  return (
    <div style={s.doc}>
      {/* ---- PAGE 1 : Présentation + Questions préliminaires ---- */}
      <div style={s.page}>
        <Entete org={org} G={G}/>
        <Section titre="Présentation de l'organisme, en quelques mots">
          <Edit value={gd.presentation} onChange={v=>setGD({presentation:v})} ph="Présentation de l'organisme…"/>
        </Section>
        <Section titre="Liste des prestations/formations proposées et/ou réalisées par l'organisme">
          <Edit value={gd.prestations} onChange={v=>setGD({prestations:v})} ph="Liste des prestations…"/>
        </Section>
        <Section titre="Échantillonnage par catégories d'actions">
          <Edit value={gd.echantillon} onChange={v=>setGD({echantillon:v})} ph="Programme(s) retenu(s) pour l'échantillonnage…"/>
        </Section>
        <Section titre="Points forts de l'organisme">
          <Edit value={gd.pointsForts} onChange={v=>setGD({pointsForts:v})} ph="Points forts…"/>
        </Section>
        <Section titre="Commentaire général">
          <Edit value={gd.commentaire} onChange={v=>setGD({commentaire:v})} ph="Commentaire général…"/>
        </Section>

        <h2 style={s.bigTitle}>Questions préliminaires avant remplissage</h2>
        <div style={s.qpHead}>
          <span>{CAT_GRILLE[G.cat]}</span>
          <span style={{display:"flex",gap:48}}><span>Oui</span><span>Non</span></span>
        </div>
        {questionsPrelim.map(q=>(
          <div key={q.cle} style={s.qpRow}>
            <span style={{flex:1,fontSize:13.5,paddingRight:20}}>{q.libelle}</span>
            <div style={{display:"flex",gap:40,alignItems:"center"}}>
              <Radio on={gd.rep[q.cle]===true} color={C_ROND} onClick={()=>setRep(q.cle,true)}/>
              <Radio on={gd.rep[q.cle]===false} color="#dc2626" cross onClick={()=>setRep(q.cle,false)}/>
            </div>
          </div>
        ))}
        <Pied page={++pageNo} total={totalPages}/>
      </div>

      {/* ---- PAGES INDICATEURS ---- */}
      {criteres.map(cr=>(
        applic.filter(a=>a.ind.critere===cr.id).map(({ind,applicable})=>{
          pageNo++;
          const dec = gd.dec[ind.id] || (applicable?null:"NON_APPLICABLE");
          return (
            <div key={ind.id} style={s.page}>
              <Entete org={org} G={G}/>
              <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0 14px",flexWrap:"wrap"}}>
                <h1 style={{...s.indTitre,margin:0}}>Indicateur #{ind.id} {G.cat}</h1>
                <span style={{
                  padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:700,
                  letterSpacing:.3,textTransform:"uppercase",
                  background: ind.nc==="MAJEURE" ? "#dc2626" : "#ea580c",
                  color:"#fff",
                }}>
                  {ind.nc==="MAJEURE" ? "Majeur" : "Mineur"}
                </span>
              </div>
              <p style={s.indLine}><b>Niveau attendu :</b> {ind.attendu}</p>
              <p style={s.indLine}><b>Définition :</b> {ind.definition}</p>
              <div style={s.dotSep}/>

              <div style={s.pcHead}>
                <span style={{flex:1}}>Points de conformité</span>
                <span style={{display:"flex",gap:0}}>
                  <span style={s.pcCol}>Oui</span>
                  <span style={s.pcCol}>Partiel</span>
                  <span style={s.pcCol}>Non</span>
                </span>
              </div>
              {ind.points.map((p,i)=>(
                <div key={i} style={{...s.pcRow, background:i%2?"#fafafa":"#fff"}}>
                  <span style={{flex:1,fontSize:13,paddingRight:16,
                    textDecoration:applicable?"none":"line-through",
                    color:applicable?"#2a2a2a":"#b0b0b0"}}>{p}</span>
                  <div style={{display:"flex"}}>
                    {["OUI","PARTIEL","NON"].map(v=>(
                      <span key={v} style={s.pcCell}>
                        <Radio disabled={!applicable}
                          on={(gd.pts[ind.id]||{})[i]===v}
                          color={v==="OUI"?C_ROND:v==="PARTIEL"?"#ea580c":"#dc2626"}
                          onClick={()=>applicable&&setPt(ind.id,i,v)}/>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div style={s.dotSep}/>

              <div style={s.decLabel}>Décision</div>
              {applicable ? (
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {[["CONFORME","Conforme",C_TEAL],
                    ["NON_CONFORME","Non conforme", ind.nc==="MAJEURE"?"#dc2626":"#ea580c"],
                    ["NON_APPLICABLE","Non applicable","#9a9aa3"]].map(([v,l,c])=>(
                    <button key={v} onClick={()=>setDec(ind.id,v)}
                      style={dec===v
                        ? {...s.decBox, background:c, color:"#fff", borderColor:c}
                        : {...s.decBox, color:c, borderColor:c}}>
                      <span style={{fontSize:15}}>{dec===v?"●":"○"}</span>{l}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{...s.decBox, background:"#f4f4f5", color:"#7a7a85", borderColor:"#e0e0e3", width:90, flexDirection:"column", height:"auto", padding:"12px 8px"}}>
                  <span style={{fontSize:16}}>⬤</span>
                  <span style={{fontSize:12,textAlign:"center"}}>Non applicable</span>
                </div>
              )}

              {applicable && (
                <>
                  <div style={s.preuveTitle}>Elements de preuve consultés</div>
                  <div style={s.preuveSub}>Process :</div>
                  <Edit value={gd.proc[ind.id]} onChange={v=>setProc(ind.id,v)} ph="Description du process constaté…" small/>
                  <div style={s.preuveSub}>Preuves :</div>
                  <Edit value={gd.preuve[ind.id]} onChange={v=>setPreuve(ind.id,v)} ph="- Liste des preuves consultées…" small/>
                  {dec==="NON_CONFORME" && (
                    <>
                      <div style={s.preuveSub}>Écart constaté :</div>
                      <Edit value={(gd.ecart||{})[ind.id]} onChange={v=>setGD({ecart:{...(gd.ecart||{}),[ind.id]:v}})} ph="Description de l'écart…" small/>
                    </>
                  )}
                </>
              )}
              <Pied page={pageNo} total={totalPages}/>
            </div>
          );
        })
      ))}

      {/* ---- PAGE SYNTHÈSE ---- */}
      <PageSynthese org={org} G={G} maj={maj} min={min} applic={applic} gd={gd}
        page={totalPages-2} total={totalPages}/>

      {/* ---- PAGES FINALES (logo / certificat) ---- */}
      <PageLogo org={org} G={G} gd={gd} setGD={setGD} page={totalPages-1} total={totalPages}/>
      <PageCertificat org={org} G={G} gd={gd} setGD={setGD} page={totalPages} total={totalPages}/>
    </div>
  );
}

/* ====== Page Logo Qualiopi ====== */
function PageLogo({ org, G, gd, setGD, page, total }) {
  const f = gd.finales || {};
  const set = (k,v) => setGD({ finales: {...f, [k]:v} });
  const logoUtilise = f.logo_utilise;       // true / false / undefined
  const charteOK = f.logo_charte;            // 'OUI' / 'PARTIEL' / 'NON'
  const dec = f.logo_dec;
  return (
    <div style={s.page}>
      <Entete org={org} G={G}/>
      <h1 style={{...s.bigTitle, marginTop:4}}>Vérification de l'usage du logo Qualiopi</h1>
      <p style={{fontSize:13,lineHeight:1.65,color:"#3a3a3a",margin:"0 0 6px"}}>
        Vérification de l'auditeur si l'usage de la marque Qualiopi est conforme à la charte d'usage disponible ici :<br/>
        <a href="https://certifopac.fr/qualiopi/logo-marque-charte/" target="_blank" rel="noreferrer" style={{color:C_BLEU}}>https://certifopac.fr/qualiopi/logo-marque-charte/</a>
      </p>
      <div style={s.dotSep}/>

      {/* Q1 : Oui/Non seulement */}
      <div style={s.pcHead}>
        <span style={{flex:1}}>Points de conformité</span>
        <span style={{display:"flex"}}>
          <span style={s.pcCol}>Oui</span>
          <span style={s.pcCol}>Non</span>
        </span>
      </div>
      <div style={{...s.pcRow, background:"#fff"}}>
        <span style={{flex:1,fontSize:13}}>Le logo Qualiopi est-il utilisé ?</span>
        <div style={{display:"flex"}}>
          <span style={s.pcCell}><Radio on={logoUtilise===true} color={C_ROND} onClick={()=>set("logo_utilise",true)}/></span>
          <span style={s.pcCell}><Radio on={logoUtilise===false} color="#dc2626" cross onClick={()=>set("logo_utilise",false)}/></span>
        </div>
      </div>

      {/* Q2 : Oui/Partiel/Non — applicable seulement si Q1 = Oui */}
      <div style={{...s.pcHead, marginTop:14}}>
        <span style={{flex:1}}></span>
        <span style={{display:"flex"}}>
          <span style={s.pcCol}>Oui</span><span style={s.pcCol}>Partiel</span><span style={s.pcCol}>Non</span>
        </span>
      </div>
      <div style={{...s.pcRow, background:"#fafafa"}}>
        <span style={{flex:1,fontSize:13,paddingRight:16,
          textDecoration: logoUtilise===true ? "none" : "line-through",
          color: logoUtilise===true ? "#2a2a2a" : "#b0b0b0"}}>
          L'utilisation du logo est-elle en conformité avec la charte et le règlement d'usage ?
        </span>
        <div style={{display:"flex"}}>
          {["OUI","PARTIEL","NON"].map(v=>(
            <span key={v} style={s.pcCell}>
              <Radio disabled={logoUtilise!==true}
                on={charteOK===v}
                color={v==="OUI"?C_ROND:v==="PARTIEL"?"#ea580c":"#dc2626"}
                onClick={()=>logoUtilise===true && set("logo_charte",v)}/>
            </span>
          ))}
        </div>
      </div>
      <div style={s.dotSep}/>

      <div style={s.decLabel}>Décision</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[["CONFORME","Conforme",C_TEAL],
          ["NON_CONFORME","Non conforme","#dc2626"],
          ["NON_APPLICABLE","Non applicable","#9a9aa3"]].map(([v,l,c])=>(
          <button key={v} onClick={()=>set("logo_dec",v)}
            style={dec===v
              ? {...s.decBox, background:c, color:"#fff", borderColor:c}
              : {...s.decBox, color:c, borderColor:c}}>
            <span style={{fontSize:15}}>{dec===v?"●":"○"}</span>{l}
          </button>
        ))}
      </div>

      <div style={{...s.preuveTitle, marginTop:22}}>Commentaire sur l'utilisation du logo</div>
      <Edit value={f.logo_comment} onChange={v=>set("logo_comment",v)} ph="RAS, observations, recommandations…" small/>
      <Pied page={page} total={total}/>
    </div>
  );
}

/* ====== Page Affichage du certificat ====== */
function PageCertificat({ org, G, gd, setGD, page, total }) {
  const f = gd.finales || {};
  const set = (k,v) => setGD({ finales: {...f, [k]:v} });
  const aDistance = G.type !== "INITIAL"; // surveillance / renouvellement à distance
  return (
    <div style={s.page}>
      <Entete org={org} G={G}/>
      <h1 style={{...s.bigTitle, marginTop:4}}>Obligation d'affichage et de communication du certificat</h1>
      <p style={{fontSize:13,lineHeight:1.65,color:"#3a3a3a",margin:"0 0 6px"}}>
        L'article 1er de l'arrêté du 31 mai 2023 précise que l'organisme certifié affiche son certificat dans ses locaux et sur son site internet. En l'absence de site internet, il en communique une copie à tout candidat, stagiaire, apprenti ou financeur mentionné à l'article L. 6316-1 du code du travail qui en fait la demande. En savoir plus ici :<br/>
        <a href="https://certifopac.fr/qualiopi/actualites/afficher-certificat/" target="_blank" rel="noreferrer" style={{color:C_BLEU}}>https://certifopac.fr/qualiopi/actualites/afficher-certificat/</a>
      </p>
      <div style={s.dotSep}/>

      <div style={s.pcHead}>
        <span style={{flex:1}}>Points de conformité</span>
        <span style={{display:"flex"}}>
          <span style={s.pcCol}>Oui</span>
          <span style={s.pcCol}>Non</span>
        </span>
      </div>
      {[
        ["cert_locaux","Le certificat est affiché dans les locaux ou à défaut des dispositions sont prises et mises en œuvre pour le communiquer à toutes personnes qui en fait la demande : candidat, stagiaire, apprenti ou financeur mentionné à l'article L. 6316-1 du code du travail"],
        ["cert_site","Le certificat est affiché sur le site internet. En l'absence de site internet, des dispositions sont prises et mises en œuvre pour le communiquer à toutes personnes qui en fait la demande : candidat, stagiaire, apprenti ou financeur mentionné à l'article L. 6316-1 du code du travail"],
      ].map(([k,libelle],i)=>(
        <div key={k} style={{...s.pcRow, background:i%2?"#fafafa":"#fff"}}>
          <span style={{flex:1,fontSize:13,paddingRight:16}}>{libelle}</span>
          <div style={{display:"flex"}}>
            <span style={s.pcCell}><Radio on={f[k]===true} color={C_ROND} onClick={()=>set(k,true)}/></span>
            <span style={s.pcCell}><Radio on={f[k]===false} color="#dc2626" cross onClick={()=>set(k,false)}/></span>
          </div>
        </div>
      ))}
      <div style={s.dotSep}/>

      <div style={s.decLabel}>Décision</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[["CONFORME","Conforme",C_TEAL],
          ["NON_CONFORME","Non conforme","#dc2626"],
          ["NON_APPLICABLE","Non applicable","#9a9aa3"]].map(([v,l,c])=>(
          <button key={v} onClick={()=>set("cert_dec",v)}
            style={f.cert_dec===v
              ? {...s.decBox, background:c, color:"#fff", borderColor:c}
              : {...s.decBox, color:c, borderColor:c}}>
            <span style={{fontSize:15}}>{f.cert_dec===v?"●":"○"}</span>{l}
          </button>
        ))}
      </div>

      <div style={{...s.preuveTitle, marginTop:22}}>Commentaire sur l'affichage du certificat</div>
      <Edit value={f.cert_comment} onChange={v=>set("cert_comment",v)} ph="URL du site, observations…" small/>

      {aDistance && (
        <>
          <div style={{...s.secTitle, marginTop:30}}>Audit à distance</div>
          <div style={s.secBar}/>
          <div style={{marginTop:14}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:5}}>Logiciel utilisé en visioconférence : à définir entre les deux parties</div>
            <Edit value={f.visio_logiciel} onChange={v=>set("visio_logiciel",v)} ph="Ex : Teams, Zoom…" small/>
            <div style={{fontSize:13,fontWeight:700,marginTop:14,marginBottom:5}}>Efficacité des outils pendant l'audit à distance ?</div>
            <Edit value={f.visio_efficacite} onChange={v=>set("visio_efficacite",v)} ph="Oui / Non + commentaire…" small/>
          </div>
        </>
      )}
      <Pied page={page} total={total}/>
    </div>
  );
}

function PageSynthese({ org, G, maj, min, applic, gd, page, total }) {
  const av = syntheseAvis(maj,min);
  let conf=0,na=0,nr=0;
  applic.forEach(a=>{
    if(!a.applicable){na++;return;}
    const d=gd.dec[a.ind.id];
    if(d==="CONFORME")conf++; else if(d==="NON_APPLICABLE")na++;
    else if(d==="NON_CONFORME"){} else nr++;
  });
  return (
    <div style={s.page}>
      <Entete org={org} G={G}/>
      <h1 style={s.indTitre}>Synthèse — {G.cat} · {TYP_GRILLE[G.type]}</h1>
      <div style={{...s.synthBox, borderColor:av.couleur, background:av.couleur+"12"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{width:12,height:12,borderRadius:9,background:av.couleur}}/>
          <span style={{fontSize:20,fontWeight:700,color:av.couleur}}>Avis de certification {av.label.toLowerCase()}</span>
        </div>
        <div style={{fontSize:13.5,marginTop:8,color:"#3a3a3a"}}>{av.txt}</div>
      </div>
      <div style={s.synthGrid}>
        {[["Conformes",conf,C_TEAL],["NC majeures",maj,"#dc2626"],
          ["NC mineures",min,"#ea580c"],["Non applicables",na,"#9a9aa3"]].map(([l,v,c])=>(
          <div key={l} style={s.synthStat}>
            <div style={{fontSize:30,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:12,color:"#7a7a85"}}>{l}</div>
          </div>
        ))}
      </div>
      {nr>0 && <div style={s.nrWarn}>{nr} indicateur(s) applicable(s) sans décision saisie.</div>}
      <div style={{marginTop:20,fontSize:12.5,color:"#7a7a85",lineHeight:1.8}}>
        <b>Règle de décision :</b><br/>
        0 NC → Favorable (certification de plein droit)<br/>
        1 à 4 NC mineures → Réservé (levée sous 6 mois ou audit de surveillance)<br/>
        ≥ 5 NC mineures ou ≥ 1 NC majeure → Défavorable (levée sous 3 mois)
      </div>
      <Pied page={page} total={total}/>
    </div>
  );
}

/* ---- petits composants ---- */
function Section({ titre, children }) {
  return (
    <div style={{marginBottom:22}}>
      <div style={s.secTitle}>{titre}</div>
      <div style={s.secBar}/>
      <div style={{marginTop:10}}>{children}</div>
    </div>
  );
}
function Edit({ value, onChange, ph, small }) {
  return (
    <textarea 
      value={value||""} 
      onChange={e=>onChange(e.target.value)} 
      placeholder={ph}
      className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm font-semibold resize-y ${small ? 'min-h-[44px]' : 'min-h-[64px]'}`}
    />
  );
}
function Radio({ on, color, cross, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{...s.radio, cursor:disabled?"default":"pointer",
        borderColor: on?color:"#c8c8ce",
        background: on?color:"#fff"}}>
      {on && <span style={{color:"#fff",fontSize:12,fontWeight:700}}>{cross?"✕":"✓"}</span>}
    </button>
  );
}
function Pied({ page, total }) {
  return <div style={s.pied}>Page {page} sur {total}</div>;
}
function F({ l, children }) {
  return <label className="block mb-4"><span className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">{l}</span>{children}</label>;
}

/* ---- STYLES ---- */
const s = {
  app:{flex:1, background:"transparent",fontFamily:"'Inter',-apple-system,system-ui,sans-serif",color:"#2a2a2a",padding:"24px 0 60px", width:"100%"},
  shell:{maxWidth:2000,margin:"0 auto",padding:"0 24px",width:"100%"},
  config:{background:"#fff",borderRadius:12,padding:24,marginBottom:22,boxShadow:"0 1px 3px rgba(0,0,0,.06)", border: "1px solid #f3f4f6"},
  configHead:{display:"flex",alignItems:"center",gap:12,marginBottom:18},
  logo:{width:34,height:34,borderRadius:8,background:"#1c1c28",color:"#fff",display:"grid",placeItems:"center",fontWeight:800,fontSize:13},
  cfgGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18,paddingBottom:18,borderBottom:"1px solid #f0f0f2"},
  fLbl:{fontSize:11,fontWeight:600,color:"#8a8a92",display:"block",marginBottom:4},
  in:{width:"100%",border:"1px solid #d8d8de",borderRadius:7,padding:"7px 9px",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"},
  cfgRow:{display:"flex",alignItems:"flex-end",gap:20},
  cfgLbl:{fontSize:12,fontWeight:600,color:"#5a5a62",marginBottom:8},
  hint:{fontSize:11,color:"#a0a0a8",fontWeight:400},
  pillRow:{display:"flex",gap:7,flexWrap:"wrap"},
  pill:{padding:"8px 14px",borderRadius:8,border:"1px solid #d4d4da",background:"#fff",fontSize:13,fontWeight:600,color:"#6a6a72",cursor:"pointer"},
  pillOn:{padding:"8px 14px",borderRadius:8,border:"1px solid #1c1c28",background:"#1c1c28",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6},
  check:{fontSize:11},
  genBtn:{padding:"11px 20px",borderRadius:8,border:"none",background:C_BLEU,color:"#fff",fontSize:13.5,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"},
  tabsWrap:{marginTop:20,paddingTop:18,borderTop:"1px solid #f0f0f2"},
  tabs:{display:"flex",gap:8,flexWrap:"wrap"},
  tab:{display:"flex",alignItems:"center",gap:9,padding:"9px 13px",borderRadius:9,border:"1px solid #dcdce0",background:"#fff",cursor:"pointer"},
  tabOn:{display:"flex",alignItems:"center",gap:9,padding:"9px 13px",borderRadius:9,border:"1px solid #1c1c28",background:"#1c1c28",color:"#fff",cursor:"pointer"},
  tabX:{border:"none",background:"transparent",color:"inherit",fontSize:16,cursor:"pointer",opacity:.5,padding:0,lineHeight:1},
  empty:{background:"#fff",borderRadius:12,padding:"60px 24px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,.06)"},
  doc:{display:"flex",flexDirection:"column",gap:24},
  page:{background:"#fff",borderRadius:4,padding:"36px 44px 56px",boxShadow:"0 1px 4px rgba(0,0,0,.10)",position:"relative",minHeight:560},
  entete:{display:"flex",gap:18,paddingBottom:16,borderBottom:"1px solid #d8d8de",marginBottom:26,position:"relative"},
  col:{flex:1,minWidth:0},
  colLabel:{fontSize:11.5,color:"#8a9aa8",marginBottom:3},
  colStrong:{fontSize:12.5,fontWeight:700,color:"#2a2a2a",lineHeight:1.35},
  colTxt:{fontSize:11.5,color:"#5a5a62",lineHeight:1.4,wordBreak:"break-word"},
  badge:{width:78,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,border:"1px solid #e4e4e8",borderRadius:8,padding:"6px"},
  secTitle:{fontSize:14.5,fontWeight:700,color:C_BLEU},
  secBar:{height:2,background:C_BLEU,marginTop:5,opacity:.85},
  bigTitle:{fontSize:26,fontWeight:700,color:C_BLEU,margin:"26px 0 16px"},
  qpHead:{display:"flex",alignItems:"center",fontWeight:700,fontSize:13,padding:"8px 0",color:"#2a2a2a"},
  qpRow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderTop:"1px solid #efeff1",minHeight:30},
  indTitre:{fontSize:22,fontWeight:700,color:C_BLEU,margin:"4px 0 14px"},
  indLine:{fontSize:13,lineHeight:1.65,margin:"0 0 8px",color:"#2a2a2a"},
  dotSep:{borderTop:"1px dashed #c8c8ce",margin:"22px 0"},
  pcHead:{display:"flex",alignItems:"center",fontWeight:700,fontSize:13,paddingBottom:10},
  pcCol:{width:64,textAlign:"center"},
  pcRow:{display:"flex",alignItems:"center",padding:"11px 8px",borderRadius:3},
  pcCell:{width:64,display:"flex",justifyContent:"center"},
  decLabel:{fontWeight:700,fontSize:13,marginBottom:10},
  decBox:{display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:6,border:"1.5px solid",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"},
  preuveTitle:{fontWeight:700,fontSize:13,marginTop:22,marginBottom:8},
  preuveSub:{fontWeight:700,fontSize:12.5,marginTop:10,marginBottom:5,color:"#3a3a3a"},
  edit:{width:"100%",border:"1px solid #e0e0e4",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.6},
  radio:{width:22,height:22,borderRadius:99,border:"2px solid",display:"grid",placeItems:"center",padding:0},
  pied:{position:"absolute",bottom:20,right:44,fontSize:11.5,color:"#9a9aa3"},
  synthBox:{borderRadius:8,border:"2px solid",padding:18,marginBottom:18},
  synthGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12},
  synthStat:{border:"1px solid #e8e8ec",borderRadius:8,padding:"16px 8px",textAlign:"center"},
  nrWarn:{marginTop:14,fontSize:12.5,color:"#b45309",background:"#fffbeb",padding:"10px 14px",borderRadius:7},
};
const CSS = `
.audit-qualiopi-container { width: 100%; }
button{font-family:inherit}
input:focus,textarea:focus{border-color:#1d6fb8 !important;box-shadow:0 0 0 3px rgba(29,111,184,.10)}
button:not(:disabled):hover{filter:brightness(.97)}
button:disabled{opacity:.4;cursor:not-allowed}
@media(max-width:720px){
  [style*="repeat(4,1fr)"]{grid-template-columns:1fr 1fr !important}
  [style*="display: flex"][style*="align-items: flex-end"]{flex-direction:column !important;align-items:stretch !important}
}
`;
