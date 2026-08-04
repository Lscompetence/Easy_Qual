/* global describe, before, after, it, process */
import chrome from 'selenium-webdriver/chrome.js';
import { Builder, By, until, Key } from 'selenium-webdriver';
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const driverPath = path.resolve(__dirname, '../../node_modules/chromedriver/lib/chromedriver/chromedriver.exe');

// ⚙️ Config surchargeables par variables d'environnement (évite les mots de passe en dur / obsolètes)
// Lancer le serveur avant : npm run dev -- --port 5188 --strictPort
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5188';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'devweb.lsc@outlook.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '123456';
const CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL || 'sofiane.dnednia@gmail.com';
const CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD || '123456';
const CONSULTANT_EMAIL = process.env.E2E_CONSULTANT_EMAIL || 'yassinealaoui095@gmail.com';
const CONSULTANT_PASSWORD = process.env.E2E_CONSULTANT_PASSWORD || 'Pass123456';

describe('Selenium E2E Tests - EasyQual', function () {
  let driver;

  this.timeout(90000);

  before(async function () {
    console.log("⏳ Démarrage du navigateur Chrome via le pilote local intégré...");
    const service = new chrome.ServiceBuilder(driverPath);
    
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service)
      .build();
    await driver.manage().window().maximize();
    console.log("✅ Navigateur Chrome ouvert et fenêtré au maximum !");
  });

  after(async function () {
    if (driver) {
      await driver.quit();
      console.log("✅ Navigateur Chrome fermé avec succès !");
    }
  });

  async function acceptCookies(role) {
    try {
      await driver.executeScript((r) => {
        sessionStorage.setItem(`easyqual_cookie_consent_session_${r}`, 'accepted');
      }, role);
      await driver.navigate().refresh();
      console.log(`🍪 Cookies acceptés via sessionStorage pour le rôle: ${role}`);
    } catch (e) {
      console.log("Impossible d'injecter le consentement cookie:", e.message);
    }
  }

  it('1. devrait afficher la page de connexion et tester la connexion Administrateur', async function () {
    console.log("🌐 Navigation vers l'espace Administrateur sécurisé...");
    await driver.get(`${BASE_URL}/admin-lsc-secure`);
    
    console.log("🍪 Contournement du bandeau cookie...");
    await acceptCookies('admin');

    console.log("👁️ Attente du chargement de la page de connexion admin...");
    await driver.wait(until.elementLocated(By.id('email-address')), 15000);

    const title = await driver.getTitle();
    console.log("📄 Titre de la page :", title);
    assert.ok(title.toLowerCase().includes('easy'), "Le titre de la page doit contenir 'easy'");

    console.log("✍️ Saisie des identifiants admin...");
    const emailInput = await driver.findElement(By.id('email-address'));
    const passwordInput = await driver.findElement(By.id('password'));

    await emailInput.sendKeys(ADMIN_EMAIL);
    await passwordInput.sendKeys(ADMIN_PASSWORD);

    console.log("🖱️ Clic sur le bouton de connexion...");
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();

    console.log("👁️ Attente de la redirection vers le tableau de bord Admin...");
    await driver.wait(until.urlContains('/admin/dashboard'), 15000);
    console.log("✅ Redirection vers /admin/dashboard réussie !");

    console.log("👀 Attente du bouton de déconnexion...");
    const logoutBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Déconnexion')]")), 10000);
    
    console.log("🖱️ Déconnexion de l'administrateur...");
    await logoutBtn.click();
    await driver.wait(until.urlContains('/admin-lsc-secure'), 10000);
    console.log("✅ Déconnexion Admin réussie !");
  });

  it('2. devrait tester la connexion Client (OF)', async function () {
    console.log("🌐 Navigation vers l'espace Client...");
    await driver.get(`${BASE_URL}/login?role=client`);
    
    console.log("🍪 Contournement du bandeau cookie...");
    await acceptCookies('of');

    console.log("👁️ Attente du chargement de la page de connexion client...");
    await driver.wait(until.elementLocated(By.id('email-address')), 15000);

    console.log("✍️ Saisie des identifiants client...");
    const emailInput = await driver.findElement(By.id('email-address'));
    const passwordInput = await driver.findElement(By.id('password'));

    await emailInput.sendKeys(CLIENT_EMAIL);
    await passwordInput.sendKeys(CLIENT_PASSWORD);

    console.log("🖱️ Clic sur le bouton de connexion...");
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();

    console.log("👁️ Attente de la redirection vers le tableau de bord Client...");
    await driver.wait(until.urlContains('/client/dashboard'), 15000);
    console.log("✅ Redirection vers /client/dashboard réussie !");

    console.log("👀 Attente du bouton de déconnexion client...");
    const logoutBtn = await driver.wait(until.elementLocated(By.xpath("//button[@title='Déconnexion']")), 10000);
    
    console.log("🖱️ Déconnexion du client...");
    await logoutBtn.click();
    await driver.wait(until.urlContains('/login'), 10000);
    console.log("✅ Déconnexion Client réussie !");
  });

  it('3. devrait tester la connexion Consultant, la recharge de crédits et le levier commercial', async function () {
    console.log("🌐 Navigation vers l'espace Consultant...");
    await driver.get(`${BASE_URL}/login?role=consultant`);
    
    console.log("🍪 Contournement du bandeau cookie...");
    await acceptCookies('consultant');

    console.log("👁️ Attente du chargement de la page de connexion consultant...");
    await driver.wait(until.elementLocated(By.id('email-address')), 15000);

    console.log("✍️ Saisie des identifiants consultant...");
    const emailInput = await driver.findElement(By.id('email-address'));
    const passwordInput = await driver.findElement(By.id('password'));

    await emailInput.sendKeys(CONSULTANT_EMAIL);
    await passwordInput.sendKeys(CONSULTANT_PASSWORD);

    console.log("🖱️ Clic sur le bouton de connexion...");
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();

    console.log("👁️ Attente de la redirection vers le tableau de bord Consultant...");
    await driver.wait(until.urlContains('/consultant/dashboard'), 15000);
    console.log("✅ Redirection vers /consultant/dashboard réussie !");

    console.log("🖱️ Clic sur le bouton de recharge...");
    const rechargeBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Recharger')]")), 10000);
    await rechargeBtn.click();

    console.log("👁️ Attente de l'apparition du modal de recharge...");
    const qtyInput = await driver.wait(until.elementLocated(By.id('qty-pro')), 10000);
    console.log("✅ Modal de recharge ouvert avec succès !");

    console.log("✍️ Saisie de 9 crédits pour déclencher le levier commercial...");
    await qtyInput.sendKeys(Key.chord(Key.CONTROL, "a"), Key.BACK_SPACE);
    await qtyInput.sendKeys('9');

    console.log("👁️ Attente de l'apparition de l'alerte d'opportunité commerciale...");
    const opportunityAlert = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(text(), 'Opportunité')]/ancestor::div[contains(@class, 'glow-card-9')]")),
      10000
    );
    assert.ok(opportunityAlert, "L'alerte d'opportunité commerciale doit s'afficher pour 9 crédits.");
    console.log("✅ Alerte opportunité trouvée avec succès !");

    console.log("🖱️ Clic sur le bouton d'optimisation (Passer à 10 crédits)...");
    const optimizeBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Passer à 10 crédits')]"));
    await optimizeBtn.click();

    console.log("👁️ Vérification que la quantité est passée à 10...");
    const updatedQty = await driver.findElement(By.id('qty-expert')).getAttribute('value');
    assert.strictEqual(updatedQty, '10', "La quantité doit être mise à jour à 10 crédits.");
    console.log("✅ Quantité optimisée à 10 crédits !");

    console.log("🖱️ Clic sur 'Commander'...");
    // Le clic peut être perdu si React re-rend le bouton : on re-localise et on réessaie jusqu'à 3 fois
    let recapVisible = false;
    for (let attempt = 1; attempt <= 3 && !recapVisible; attempt++) {
      const orderBtn = await driver.findElement(By.id('btn-order-expert'));
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", orderBtn);
      await driver.sleep(400);
      await driver.executeScript("arguments[0].click();", orderBtn);
      try {
        await driver.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'Récapitulatif de la commande')]")), 5000);
        recapVisible = true;
      } catch {
        console.log(`   ↻ Tentative ${attempt} sans effet, nouveau clic...`);
      }
    }

    console.log("👁️ Vérification de l'affichage du panier final (Étape de confirmation)...");
    assert.ok(recapVisible, "L'étape de récapitulatif de commande doit s'afficher.");

    const totalToPay = await driver.findElement(By.xpath("//span[contains(text(), '1600')]"));
    assert.ok(totalToPay, "Le prix final doit afficher 1600€ HT pour 10 crédits.");
    console.log("✅ Panier final validé avec succès (1600€ HT pour 10 crédits) !");

    console.log("🖱️ Fermeture du modal de recharge...");
    const closeModalBtn = await driver.findElement(By.xpath("//button[contains(@class, 'absolute') and .//*[local-name()='svg']]"));
    await driver.executeScript("arguments[0].click();", closeModalBtn);

    console.log("👀 Attente du bouton de déconnexion consultant...");
    const logoutBtn = await driver.wait(until.elementLocated(By.xpath("//button[@title='Déconnexion']")), 10000);
    
    console.log("🖱️ Déconnexion du consultant...");
    await logoutBtn.click();
    await driver.wait(until.urlContains('/login'), 10000);
    console.log("✅ Déconnexion Consultant réussie !");
  });
});
