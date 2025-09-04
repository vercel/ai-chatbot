#!/usr/bin/env python3
"""
Script de teste para validar implementações de segurança da Claude Chat API.

Executa testes básicos dos sistemas de validação, sanitização e rate limiting.
"""

import asyncio
import json
import uuid
import time
from typing import Dict, Any, List
from pydantic import ValidationError

# Imports das implementações
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from security_models import SecureChatMessage, SecureSessionAction, SecureSessionConfigRequest
from session_validator import SessionValidator
from rate_limiter import RateLimitManager, RateLimitRule
from security_middleware import SecurityValidationError


class SecurityTester:
    """Tester para validações de segurança."""
    
    def __init__(self):
        self.session_validator = SessionValidator()
        self.rate_limiter = RateLimitManager()
        self.test_results: List[Dict[str, Any]] = []
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log resultado de um teste."""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': time.time()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   └─ {details}")
    
    def test_uuid_validation(self):
        """Testa validação de UUID."""
        print("\n🔍 Testando Validação de UUID...")
        
        # Casos válidos
        valid_uuids = [
            str(uuid.uuid4()),
            "550e8400-e29b-41d4-a716-446655440000",
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        ]
        
        for test_uuid in valid_uuids:
            is_valid = self.session_validator.is_valid_uuid(test_uuid)
            self.log_test(
                f"UUID válido: {test_uuid[:8]}...",
                is_valid,
                "UUID deveria ser aceito"
            )
        
        # Casos inválidos
        invalid_uuids = [
            "",
            "invalid-uuid",
            "550e8400-e29b-41d4-a716",  # Muito curto
            "550e8400-e29b-41d4-a716-446655440000-extra",  # Muito longo
            "00000000-0000-0000-0000-000000000000",  # UUID nulo
            "gggggggg-gggg-gggg-gggg-gggggggggggg",  # Caracteres inválidos
        ]
        
        for test_uuid in invalid_uuids:
            is_valid = self.session_validator.is_valid_uuid(test_uuid)
            self.log_test(
                f"UUID inválido: {test_uuid[:20]}...",
                not is_valid,
                "UUID deveria ser rejeitado"
            )
    
    def test_message_sanitization(self):
        """Testa sanitização de mensagens."""
        print("\n🧼 Testando Sanitização de Mensagens...")
        
        # Casos de XSS
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert(1)",
            "<img src=x onerror=alert(1)>",
            "<iframe src='javascript:alert(1)'></iframe>",
        ]
        
        for payload in xss_payloads:
            try:
                message = SecureChatMessage(message=payload, session_id=str(uuid.uuid4()))
                # Verifica se foi sanitizado
                sanitized = message.message
                has_script_tags = "<script" in sanitized.lower()
                has_javascript = "javascript:" in sanitized.lower()
                
                self.log_test(
                    f"XSS sanitizado: {payload[:30]}...",
                    not (has_script_tags or has_javascript),
                    f"Resultado: '{sanitized[:50]}...'"
                )
            except ValidationError as e:
                self.log_test(
                    f"XSS rejeitado: {payload[:30]}...",
                    True,
                    f"ValidationError: {str(e)[:100]}"
                )
        
        # Mensagens muito grandes
        large_message = "A" * 60000  # 60KB
        try:
            SecureChatMessage(message=large_message, session_id=str(uuid.uuid4()))
            self.log_test("Mensagem grande rejeitada", False, "Deveria ter sido rejeitada")
        except ValidationError:
            self.log_test("Mensagem grande rejeitada", True, "ValidationError como esperado")
    
    def test_session_action_validation(self):
        """Testa validação de ações em sessões."""
        print("\n🎯 Testando Validação de Ações...")
        
        # Session ID válido
        try:
            valid_action = SecureSessionAction(session_id=str(uuid.uuid4()))
            self.log_test("Ação com UUID válido", True, f"Session ID: {valid_action.session_id}")
        except ValidationError as e:
            self.log_test("Ação com UUID válido", False, f"Erro inesperado: {e}")
        
        # Session IDs inválidos
        invalid_session_ids = ["", "invalid", "123", None]
        
        for invalid_id in invalid_session_ids:
            try:
                SecureSessionAction(session_id=invalid_id)
                self.log_test(f"Session ID inválido rejeitado: {invalid_id}", False, "Deveria ter sido rejeitado")
            except ValidationError:
                self.log_test(f"Session ID inválido rejeitado: {invalid_id}", True, "ValidationError como esperado")
            except TypeError:
                self.log_test(f"Session ID inválido rejeitado: {invalid_id}", True, "TypeError como esperado")
    
    def test_session_config_validation(self):
        """Testa validação de configuração de sessões."""
        print("\n⚙️ Testando Validação de Configuração...")
        
        # Configuração válida
        try:
            valid_config = SecureSessionConfigRequest(
                system_prompt="Você é um assistente útil",
                allowed_tools=["Read", "Write", "Bash"],
                max_turns=10,
                permission_mode="acceptEdits",
                cwd="/home/user/projeto"
            )
            self.log_test("Configuração válida", True, "Todos os campos validados")
        except ValidationError as e:
            self.log_test("Configuração válida", False, f"Erro inesperado: {e}")
        
        # System prompt muito longo
        try:
            SecureSessionConfigRequest(system_prompt="A" * 15000)  # 15KB
            self.log_test("System prompt longo rejeitado", False, "Deveria ter sido rejeitado")
        except ValidationError:
            self.log_test("System prompt longo rejeitado", True, "ValidationError como esperado")
        
        # Ferramentas inválidas
        try:
            config = SecureSessionConfigRequest(allowed_tools=["Read", "InvalidTool", "Bash"])
            # Verifica se ferramenta inválida foi filtrada
            valid_tools_only = "InvalidTool" not in config.allowed_tools
            self.log_test("Ferramentas inválidas filtradas", valid_tools_only, f"Tools: {config.allowed_tools}")
        except ValidationError as e:
            self.log_test("Ferramentas inválidas rejeitadas", True, f"ValidationError: {e}")
        
        # Path perigoso
        dangerous_paths = ["/etc/passwd", "../../../etc", "path/with/|pipe"]
        for path in dangerous_paths:
            try:
                SecureSessionConfigRequest(cwd=path)
                self.log_test(f"Path perigoso rejeitado: {path}", False, "Deveria ter sido rejeitado")
            except ValidationError:
                self.log_test(f"Path perigoso rejeitado: {path}", True, "ValidationError como esperado")
    
    async def test_rate_limiting(self):
        """Testa sistema de rate limiting."""
        print("\n⏱️ Testando Rate Limiting...")
        
        # Inicializa rate limiter
        try:
            await self.rate_limiter.initialize()
            self.log_test("Rate limiter inicializado", True, "Inicialização bem-sucedida")
        except Exception as e:
            self.log_test("Rate limiter inicializado", False, f"Erro: {e}")
            return
        
        # Testa limite normal com endpoint específico que tem limite baixo
        client_ip = "127.0.0.1"
        allowed_requests = 0
        blocked_requests = 0
        
        # Usa endpoint /api/chat que tem limite de 30 req/min
        # Faz 35 requisições para garantir que exceda o limite
        for i in range(35):
            result = await self.rate_limiter.check_rate_limit(client_ip, "/api/chat")
            
            if result.allowed:
                allowed_requests += 1
            else:
                blocked_requests += 1
                
            # Continua para ver quantas são bloqueadas
            if i >= 32:  # Para após algumas tentativas de bloqueio
                break
        
        self.log_test(
            "Rate limiting funcionando",
            blocked_requests > 0,
            f"Permitidas: {allowed_requests}, Bloqueadas: {blocked_requests}"
        )
    
    def test_security_validation_comprehensive(self):
        """Teste abrangente do session validator."""
        print("\n🛡️ Testando Validação de Segurança Abrangente...")
        
        # Cria uma sessão fake para teste
        test_session_id = str(uuid.uuid4())
        
        # Testa validação completa
        security_result = self.session_validator.validate_session_security(test_session_id)
        
        expected_keys = ['session_id', 'valid', 'security_score', 'issues', 'recommendations', 'risk_level', 'allowed']
        has_all_keys = all(key in security_result for key in expected_keys)
        
        self.log_test(
            "Validação de segurança estruturada",
            has_all_keys,
            f"Score: {security_result['security_score']}, Risk: {security_result['risk_level']}"
        )
        
        # Testa scan de sessões suspeitas
        suspicious_scan = self.session_validator.scan_for_suspicious_sessions()
        
        expected_categories = ['invalid_format', 'missing_files', 'large_files', 'old_sessions', 'empty_sessions']
        has_all_categories = all(cat in suspicious_scan for cat in expected_categories)
        
        self.log_test(
            "Scan de sessões suspeitas",
            has_all_categories,
            f"Categorias encontradas: {list(suspicious_scan.keys())}"
        )
    
    def print_summary(self):
        """Imprime resumo dos testes."""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 RESUMO DOS TESTES")
        print(f"{'='*50}")
        print(f"Total de testes: {total_tests}")
        print(f"✅ Aprovados: {passed_tests}")
        print(f"❌ Falhas: {failed_tests}")
        print(f"Taxa de sucesso: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES COM FALHA:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['details']}")
        
        print(f"\n{'='*50}")
        print("🎯 Testes de segurança concluídos!")
        
        return failed_tests == 0


async def main():
    """Executa todos os testes de segurança."""
    print("🔐 TESTADOR DE SEGURANÇA - CLAUDE CHAT API")
    print("="*60)
    
    tester = SecurityTester()
    
    # Executa todos os testes
    tester.test_uuid_validation()
    tester.test_message_sanitization()  
    tester.test_session_action_validation()
    tester.test_session_config_validation()
    await tester.test_rate_limiting()
    tester.test_security_validation_comprehensive()
    
    # Imprime resumo
    all_passed = tester.print_summary()
    
    return all_passed


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Testes interrompidos pelo usuário")
        exit(130)
    except Exception as e:
        print(f"\n❌ Erro fatal durante testes: {e}")
        exit(1)