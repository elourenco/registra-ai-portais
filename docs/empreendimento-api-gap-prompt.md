# Solicitação de Alteração na API: Cadastro de Empreendimento

**Contexto:**
O frontend do Portal Supplier foi atualizado para utilizar tipos e modalidades aderentes ao cenário imobiliário real, tornando os campos de volumetria dinâmicos dependendo do tipo do empreendimento.
O endpoint de cadastro de empreendimentos (`POST /api/v1/developments`) precisa refletir essa nova modelagem.

**O que precisa ser implementado na API:**

1.  **Novos Enums de Tipo de Empreendimento (`developmentType`):**
    A API agora deve aceitar APENAS os seguintes valores para informar o tipo:
    - `"incorporacao_vertical"`
    - `"incorporacao_horizontal"`
    - `"loteamento"`
    - `"condominio_lotes"`
    *(Nota: Remover a obrigatoriedade/uso do campo `landProfile`).*

2.  **Novos Enums de Modalidade (`developmentModality`):**
    A API agora deve aceitar APENAS os seguintes valores:
    - `"mcmv"` (Minha Casa Minha Vida)
    - `"sbpe"`
    - `"associativo"`
    - `"terreno_construcao"`
    - `"direto_construtora"`
    *(Nota: os antigos "residential", "commercial" ou "studio" não são mais válidos aqui).*

3.  **Novos Campos de Volumetria (Condicionais / Opcionais):**
    A raiz do payload de empreendimento ou um novo objeto (ex: `volumetry`) precisa suportar:
    - `totalTowers` (número inteiro) - Usado em Incorporação Vertical
    - `totalUnits` (número inteiro) - Usado em Incorporação Vertical e Horizontal
    - `unitsPerFloor` (número inteiro) - Novo! Unidades por andar (Inc. Vertical)
    - `totalFloors` (número inteiro) - Novo! Total de andares (Inc. Vertical)
    - `totalBlocks` (número inteiro) - Novo! Total de quadras (Loteamentos)
    - `totalLots` (número inteiro) - Novo! Total de lotes (Loteamentos)

    *Esses campos devem ser tratados com validações condicionais baseadas no `developmentType` selecionado.*

4.  **Ajuste no Schema Principal (POST/PUT e Retornos GET):**
    - Remover (se for o caso) a obrigatoriedade e documentação do OpenAPI para os campos de registro imobiliário/cartório no CREATE, pois o portal agora os solicita apenas em etapa posterior no backoffice.
    - Atualizar a documentação OpenAPI (`swagger`) com as novas tipagens estritas acima descritas.
