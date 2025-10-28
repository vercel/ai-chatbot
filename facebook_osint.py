import json
import logging
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Estrutura da classe principal
class FacebookOSINT:
    """
    Classe para realizar OSINT no Facebook a partir de um número de telefone.
    Utiliza Selenium para automatizar a busca na página de recuperação de conta.
    """
    def __init__(self, rate_limit_seconds=5):
        """
        Inicializa o scraper OSINT.

        Args:
            rate_limit_seconds (int): Intervalo em segundos entre as requisições para evitar bloqueios.
        """
        self.base_url = "https://www.facebook.com/login/identify"
        self.rate_limit = rate_limit_seconds
        self.logger = self._setup_logger()
        self.driver = self._setup_driver()

    def _setup_logger(self):
        """Configura o logger para registrar eventos em um arquivo."""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] - %(message)s",
            handlers=[
                logging.FileHandler("osint_facebook.log"),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)

    def _setup_driver(self):
        """Configura e inicializa o WebDriver do Selenium em modo headless."""
        self.logger.info("Configurando o WebDriver...")
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")  # Executar em segundo plano
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

        try:
            service = ChromeService(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            self.logger.info("WebDriver configurado com sucesso.")
            return driver
        except Exception as e:
            self.logger.error(f"Falha ao configurar o WebDriver: {e}")
            raise

    def close(self):
        """Encerra o WebDriver."""
        if self.driver:
            self.logger.info("Fechando o WebDriver.")
            self.driver.quit()

    def buscar_por_telefone(self, numero_telefone):
        """
        Busca um perfil no Facebook usando um número de telefone.

        Args:
            numero_telefone (str): O número de telefone a ser buscado (formato brasileiro, ex: 11987654321).

        Returns:
            dict: Um dicionário com os dados do perfil encontrado ou uma mensagem de erro.
        """
        self.logger.info(f"Iniciando busca pelo número: {numero_telefone}")
        try:
            self.driver.get(self.base_url)

            # Aguarda o campo de e-mail/telefone estar presente e visível
            wait = WebDriverWait(self.driver, 15)
            email_input = wait.until(EC.visibility_of_element_located((By.ID, "identify_email")))

            self.logger.info("Página de identificação carregada. Inserindo número.")
            email_input.send_keys(numero_telefone)

            # Clica no botão de busca
            search_button = self.driver.find_element(By.ID, "did_submit")
            search_button.click()

            self.logger.info("Formulário enviado. Aguardando resultado...")

            # Aplica o rate limiting para simular comportamento humano
            time.sleep(self.rate_limit)

            # Após o clique, a página pode ou não mudar. A validação é feita na nova visualização.
            # Vamos esperar por um dos possíveis resultados: perfil encontrado ou não encontrado.
            wait = WebDriverWait(self.driver, 10)

            try:
                # CENÁRIO 1: Perfil encontrado
                # O Facebook mostra uma div com o nome do usuário e a foto.
                # A nova abordagem é esperar por um elemento de perfil genérico que
                # seja mais resiliente a mudanças de classe.
                # Procuramos por um contêiner que tenha um link com uma imagem e um texto.
                profile_container_selector = "div.x1i10hfl.x1qjc9v5.xjbqb8w.xjqpnuy.xa49m3k.xqeqjp1.x2hbi6w.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xdl72j9.x2lah0s.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x2lwn1j.xeuugli.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1q0g3np.x87ps6o.x1lku1pv.x1a2a7pz.x1lq5wgf.xgqcy7s.x30kzoy.x9jhf4c.x1s058fi" # Seletor genérico para o contêiner do perfil

                profile_element = wait.until(
                    EC.visibility_of_element_located((By.CSS_SELECTOR, profile_container_selector))
                )

                self.logger.info("Perfil encontrado. Extraindo dados...")

                # Seletores mais robustos baseados na estrutura
                nome_usuario = profile_element.find_element(By.CSS_SELECTOR, "span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6").text
                foto_url = profile_element.find_element(By.TAG_NAME, "img").get_attribute("src")
                perfil_url = profile_element.find_element(By.TAG_NAME, "a").get_attribute("href")

                usernames_sugeridos = self.gerar_usernames(nome_usuario)

                return {
                    "status": "sucesso",
                    "dados": {
                        "nome": nome_usuario,
                        "url_perfil": perfil_url,
                        "url_foto": foto_url,
                        "usernames_sugeridos": usernames_sugeridos
                    }
                }

            except TimeoutException:
                # Se o contêiner do perfil não for encontrado, verificamos outros cenários.
                try:
                    # Cenário de "Nenhum resultado"
                    no_results_selector = "//*[contains(text(), 'Nenhum resultado encontrado') or contains(text(), 'No search results')]"
                    self.driver.find_element(By.XPATH, no_results_selector)
                    self.logger.warning(f"Nenhum perfil encontrado para o número: {numero_telefone}")
                    return {"status": "nao_encontrado"}
                except NoSuchElementException:
                    # Cenário de CAPTCHA ou erro desconhecido
                    self.logger.error("Elemento do perfil não encontrado. A página pode ter mudado ou um CAPTCHA foi acionado.")
                    screenshot_path = "debug_screenshot.png"
                    self.driver.save_screenshot(screenshot_path)
                    self.logger.info(f"Screenshot de depuração salvo em: {screenshot_path}")
                    return {"status": "erro", "mensagem": "Layout desconhecido ou CAPTCHA."}

        except TimeoutException:
            self.logger.error("Tempo esgotado ao tentar carregar a página ou encontrar um elemento.")
            return {"erro": "Timeout ao carregar a página do Facebook."}
        except NoSuchElementException:
            self.logger.error("Não foi possível encontrar um elemento essencial na página (campo de input ou botão).")
            return {"erro": "Elemento não encontrado na página. O layout do Facebook pode ter mudado."}
        except Exception as e:
            self.logger.error(f"Ocorreu um erro inesperado durante a busca: {e}")
            return {"erro": f"Erro inesperado: {e}"}

    @staticmethod
    def gerar_usernames(nome_completo):
        """
        Gera uma lista de possíveis usernames a partir de um nome completo.

        Args:
            nome_completo (str): O nome completo do usuário.

        Returns:
            list: Uma lista de usernames gerados.
        """
        if not nome_completo:
            return []

        partes_nome = nome_completo.lower().split()
        if len(partes_nome) < 1:
            return []

        nome = partes_nome[0]
        sobrenome = partes_nome[-1] if len(partes_nome) > 1 else ""

        usernames = []

        # Padrão: nome.sobrenome
        if sobrenome:
            usernames.append(f"{nome}.{sobrenome}")

        # Padrão: n.sobrenome
        if sobrenome:
            usernames.append(f"{nome[0]}.{sobrenome}")

        # Padrão: nomesobrenome
        if sobrenome:
            usernames.append(f"{nome}{sobrenome}")
        else:
            usernames.append(nome)

        # Padrão: sobrenome.nome
        if sobrenome:
            usernames.append(f"{sobrenome}.{nome}")

        return list(set(usernames)) # Remove duplicados


# Exemplo de uso
if __name__ == "__main__":
    # IMPORTANTE: Substitua pelo número de telefone que deseja investigar.
    # O número deve estar em um formato que o Facebook reconheça,
    # geralmente incluindo o código do país e o DDD. Ex: +5511987654321
    numero_alvo = "+5511999999999"  # Use um número real para teste

    # Instancia a classe
    osint = None
    try:
        osint = FacebookOSINT(rate_limit_seconds=5)

        # Realiza a busca
        resultado = osint.buscar_por_telefone(numero_alvo)

        # Imprime o resultado em formato JSON
        print(json.dumps(resultado, indent=4, ensure_ascii=False))

    except Exception as e:
        logging.error(f"Ocorreu um erro na execução principal: {e}")
    finally:
        # Garante que o driver seja fechado ao final da execução
        if osint:
            osint.close()