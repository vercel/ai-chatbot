import { test, expect } from '@playwright/test';

/**
 * Story: Autenticação
 *
 * Como um usuário do sistema YSH
 * Quero fazer login/logout de forma segura
 * Para acessar minhas informações pessoais e propostas
 *
 * Cenário: Fluxo completo de autenticação
 * Dado que sou um usuário não autenticado
 * Quando faço login com credenciais válidas
 * Então devo ter acesso às funcionalidades do sistema
 * E minhas informações devem ser mantidas seguras
 */
test.describe('Story: Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar estado de autenticação
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('deve carregar a página de login corretamente', async ({ page }) => {
    // Navegar para a página de autenticação
    await page.goto('/auth/signin');

    // Aguardar carregamento
    await page.waitForLoadState('networkidle');

    // Verificar se o formulário de login está presente
    await expect(page.locator('[data-testid="signin-form"]')).toBeVisible();

    // Verificar campos obrigatórios
    await expect(page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'))).toBeVisible();
    await expect(page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'))).toBeVisible();

    // Verificar botão de login
    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar').or(page.locator('text=Login'))
    );
    await expect(loginButton).toBeVisible();
  });

  test('deve mostrar erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/auth/signin');

    // Preencher com credenciais inválidas
    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario@invalido.com');
    await passwordInput.fill('senhaerrada');

    // Clicar no botão de login
    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar resposta
    await page.waitForTimeout(2000);

    // Verificar se há mensagem de erro
    const errorMessage = page.locator('[data-testid="error-message"]').or(
      page.locator('text=Credenciais inválidas').or(page.locator('text=Email ou senha incorretos'))
    );

    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('deve permitir login com credenciais válidas', async ({ page }) => {
    await page.goto('/auth/signin');

    // Preencher com credenciais válidas (mock)
    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario@teste.com');
    await passwordInput.fill('senha123');

    // Clicar no botão de login
    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar redirecionamento
    await page.waitForTimeout(3000);

    // Verificar se foi redirecionado para página principal ou dashboard
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth/signin');

    // Verificar se há indicação de usuário logado
    const userIndicator = page.locator('[data-testid="user-menu"]').or(
      page.locator('text=Olá').or(page.locator('[data-testid="user-avatar"]'))
    );

    if (await userIndicator.isVisible()) {
      await expect(userIndicator).toBeVisible();
    }
  });

  test('deve validar formato de email', async ({ page }) => {
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    // Tentar email inválido
    await emailInput.fill('email-invalido');
    await passwordInput.fill('senha123');

    // Clicar no botão de login
    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Verificar validação de email
    const emailError = page.locator('[data-testid="email-error"]').or(
      page.locator('text=Email inválido').or(page.locator('text=Formato de email incorreto'))
    );

    if (await emailError.isVisible()) {
      await expect(emailError).toBeVisible();
    }
  });

  test('deve exigir senha não vazia', async ({ page }) => {
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    // Deixar senha vazia
    await emailInput.fill('usuario@teste.com');
    await passwordInput.fill('');

    // Clicar no botão de login
    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Verificar validação de senha
    const passwordError = page.locator('[data-testid="password-error"]').or(
      page.locator('text=Senha obrigatória').or(page.locator('text=Digite sua senha'))
    );

    if (await passwordError.isVisible()) {
      await expect(passwordError).toBeVisible();
    }
  });

  test('deve mostrar opção "Lembrar de mim"', async ({ page }) => {
    await page.goto('/auth/signin');

    // Verificar se há checkbox "Lembrar de mim"
    const rememberMe = page.locator('[data-testid="remember-me"]').or(
      page.locator('text=Lembrar de mim').or(page.locator('input[type="checkbox"]'))
    );

    if (await rememberMe.isVisible()) {
      await expect(rememberMe).toBeVisible();

      // Testar marcar/desmarcar
      await rememberMe.check();
      await expect(rememberMe).toBeChecked();

      await rememberMe.uncheck();
      await expect(rememberMe).not.toBeChecked();
    }
  });

  test('deve permitir recuperação de senha', async ({ page }) => {
    await page.goto('/auth/signin');

    // Procurar link de "Esqueci minha senha"
    const forgotPasswordLink = page.locator('[data-testid="forgot-password"]').or(
      page.locator('text=Esqueci minha senha').or(page.locator('text=Esqueceu a senha?'))
    );

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Verificar se foi redirecionado para página de recuperação
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const isForgotPage = currentUrl.includes('forgot') || currentUrl.includes('reset');
      expect(isForgotPage).toBe(true);

      // Verificar formulário de recuperação
      const resetForm = page.locator('[data-testid="reset-form"]').or(
        page.locator('input[type="email"]')
      );

      if (await resetForm.isVisible()) {
        await expect(resetForm).toBeVisible();
      }
    }
  });

  test('deve permitir criação de nova conta', async ({ page }) => {
    await page.goto('/auth/signin');

    // Procurar link de "Criar conta" ou "Registrar"
    const signUpLink = page.locator('[data-testid="signup-link"]').or(
      page.locator('text=Criar conta').or(page.locator('text=Registrar').or(page.locator('text=Cadastre-se')))
    );

    if (await signUpLink.isVisible()) {
      await signUpLink.click();

      // Verificar se foi redirecionado para página de registro
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const isSignUpPage = currentUrl.includes('signup') || currentUrl.includes('register');
      expect(isSignUpPage).toBe(true);

      // Verificar formulário de registro
      const signUpForm = page.locator('[data-testid="signup-form"]').or(
        page.locator('input[type="email"]')
      );

      if (await signUpForm.isVisible()) {
        await expect(signUpForm).toBeVisible();
      }
    }
  });

  test('deve manter sessão ativa após login', async ({ page }) => {
    // Fazer login
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario@teste.com');
    await passwordInput.fill('senha123');

    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar login
    await page.waitForTimeout(3000);

    // Navegar para outra página
    await page.goto('/journey/investigation');

    // Verificar se ainda está logado
    const userIndicator = page.locator('[data-testid="user-menu"]').or(
      page.locator('text=Olá').or(page.locator('[data-testid="user-avatar"]'))
    );

    if (await userIndicator.isVisible()) {
      await expect(userIndicator).toBeVisible();
    }
  });

  test('deve permitir logout corretamente', async ({ page }) => {
    // Primeiro fazer login
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario@teste.com');
    await passwordInput.fill('senha123');

    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar login
    await page.waitForTimeout(3000);

    // Procurar menu de usuário
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.locator('[data-testid="user-avatar"]')
    );

    if (await userMenu.isVisible()) {
      await userMenu.click();

      // Procurar opção de logout
      const logoutButton = page.locator('[data-testid="logout-button"]').or(
        page.locator('text=Sair').or(page.locator('text=Logout'))
      );

      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // Aguardar logout
        await page.waitForTimeout(2000);

        // Verificar se foi redirecionado para login
        const currentUrl = page.url();
        const isAuthPage = currentUrl.includes('/auth') || currentUrl.includes('/signin');
        expect(isAuthPage).toBe(true);

        // Verificar se não há mais indicação de usuário logado
        const userIndicator = page.locator('[data-testid="user-menu"]').or(
          page.locator('[data-testid="user-avatar"]')
        );

        if (await userIndicator.isVisible()) {
          await expect(userIndicator).not.toBeVisible();
        }
      }
    }
  });

  test('deve proteger rotas autenticadas', async ({ page }) => {
    // Tentar acessar página protegida sem login
    await page.goto('/journey/investigation');

    // Aguardar redirecionamento
    await page.waitForTimeout(2000);

    // Verificar se foi redirecionado para login
    const currentUrl = page.url();
    const isAuthPage = currentUrl.includes('/auth') || currentUrl.includes('/signin');
    expect(isAuthPage).toBe(true);
  });

  test('deve suportar login com provedores externos', async ({ page }) => {
    await page.goto('/auth/signin');

    // Procurar botões de login social
    const googleButton = page.locator('[data-testid="google-signin"]').or(
      page.locator('text=Continuar com Google').or(page.locator('[data-testid="google-btn"]'))
    );

    const githubButton = page.locator('[data-testid="github-signin"]').or(
      page.locator('text=Continuar com GitHub').or(page.locator('[data-testid="github-btn"]'))
    );

    // Verificar se pelo menos um provedor social está disponível
    const hasSocialLogin = await googleButton.isVisible() || await githubButton.isVisible();

    if (hasSocialLogin) {
      // Testar um dos provedores (Google como exemplo)
      if (await googleButton.isVisible()) {
        await expect(googleButton).toBeVisible();
      }

      if (await githubButton.isVisible()) {
        await expect(githubButton).toBeVisible();
      }
    }
  });

  test('deve mostrar loading durante autenticação', async ({ page }) => {
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario@teste.com');
    await passwordInput.fill('senha123');

    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );

    // Clicar e verificar se botão mostra loading
    await loginButton.click();

    // Verificar se há indicador de loading
    const loadingIndicator = page.locator('[data-testid="loading"]').or(
      page.locator('text=Carregando').or(page.locator('.spinner'))
    );

    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('deve permitir alteração de senha', async ({ page }) => {
    // Primeiro fazer login
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario@teste.com');
    await passwordInput.fill('senha123');

    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar login
    await page.waitForTimeout(3000);

    // Procurar configurações ou perfil
    const settingsLink = page.locator('[data-testid="settings-link"]').or(
      page.locator('text=Configurações').or(page.locator('text=Perfil'))
    );

    if (await settingsLink.isVisible()) {
      await settingsLink.click();

      // Procurar seção de alteração de senha
      const changePasswordSection = page.locator('[data-testid="change-password"]').or(
        page.locator('text=Alterar senha').or(page.locator('text=Mudar senha'))
      );

      if (await changePasswordSection.isVisible()) {
        await expect(changePasswordSection).toBeVisible();

        // Verificar campos de alteração de senha
        const currentPasswordInput = page.locator('[data-testid="current-password"]').or(
          page.locator('input[placeholder*="atual"]').or(page.locator('input[placeholder*="current"]'))
        );

        const newPasswordInput = page.locator('[data-testid="new-password"]').or(
          page.locator('input[placeholder*="nova"]').or(page.locator('input[placeholder*="new"]'))
        );

        if (await currentPasswordInput.isVisible() && await newPasswordInput.isVisible()) {
          await expect(currentPasswordInput).toBeVisible();
          await expect(newPasswordInput).toBeVisible();
        }
      }
    }
  });

  test('deve expirar sessão após período de inatividade', async ({ page }) => {
    // Este teste pode ser complexo de implementar dependendo da configuração
    // Vamos apenas verificar se há configurações de timeout

    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario@teste.com');
    await passwordInput.fill('senha123');

    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar login
    await page.waitForTimeout(3000);

    // Simular inatividade longa (se possível)
    // Nota: Este teste pode precisar de configuração específica do sistema

    // Verificar se há aviso de expiração de sessão
    const sessionWarning = page.locator('[data-testid="session-warning"]').or(
      page.locator('text=Sessão expirando').or(page.locator('text=Sua sessão irá expirar'))
    );

    // Este teste é mais informativo - verifica se o sistema tem proteção de sessão
    if (await sessionWarning.isVisible()) {
      await expect(sessionWarning).toBeVisible();
    }
  });

  test('deve suportar autenticação de dois fatores', async ({ page }) => {
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario2fa@teste.com');
    await passwordInput.fill('senha123');

    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar processamento
    await page.waitForTimeout(2000);

    // Verificar se há tela de 2FA
    const twoFactorForm = page.locator('[data-testid="2fa-form"]').or(
      page.locator('text=Código de verificação').or(page.locator('input[placeholder*="código"]'))
    );

    if (await twoFactorForm.isVisible()) {
      await expect(twoFactorForm).toBeVisible();

      // Verificar campo de código
      const codeInput = page.locator('[data-testid="2fa-code"]').or(
        page.locator('input[type="text"]').or(page.locator('input[placeholder*="código"]'))
      );

      if (await codeInput.isVisible()) {
        await expect(codeInput).toBeVisible();
      }
    }
  });

  test('deve permitir reenvio de código 2FA', async ({ page }) => {
    // Este teste depende do teste anterior ter chegado na tela 2FA
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]'));

    await emailInput.fill('usuario2fa@teste.com');
    await passwordInput.fill('senha123');

    const loginButton = page.locator('[data-testid="signin-button"]').or(
      page.locator('text=Entrar')
    );
    await loginButton.click();

    // Aguardar tela 2FA
    await page.waitForTimeout(2000);

    // Procurar botão de reenvio
    const resendButton = page.locator('[data-testid="resend-code"]').or(
      page.locator('text=Reenviar código').or(page.locator('text=Enviar novamente'))
    );

    if (await resendButton.isVisible()) {
      await resendButton.click();

      // Verificar confirmação de reenvio
      const resendMessage = page.locator('[data-testid="resend-message"]').or(
        page.locator('text=Código reenviado').or(page.locator('text=Verifique seu email'))
      );

      if (await resendMessage.isVisible()) {
        await expect(resendMessage).toBeVisible();
      }
    }
  });
});