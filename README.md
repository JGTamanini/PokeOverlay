# 🎮 Pokémon Party Widget — StreamElements

Widget customizado para StreamElements que exibe o time de Pokémon ao vivo na sua stream. Suporte a sprites animadas (Gen 5), held items, nicknames, evoluções, shinys e muito mais — tudo controlado pelo chat.

![Preview](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif)
![Preview](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif)
![Preview](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif)

---

## ⚙️ Instalação no StreamElements

### 1. Criar o overlay

1. Acesse [StreamElements](https://streamelements.com) e faça login
2. Vá em **My Overlays → New Overlay**
3. Defina a resolução do overlay (ex: 1920×1080)
4. Clique em **Add Element → Custom Widget**

### 2. Configurar o widget

Clique no elemento criado e abra o editor. Você verá abas separadas para cada parte do código:

| Aba | Arquivo |
|-----|---------|
| **HTML** | `widget.html` |
| **CSS** | `widget.css` |
| **JS** | `widget.js` |

Cole o conteúdo de cada arquivo na aba correspondente e clique em **Done**.

### 3. Ajustar o tamanho

Nas propriedades do elemento, defina:
- **Largura:** 800px
- **Altura:** 200px

Posicione o widget onde preferir na tela.

### 4. Adicionar ao OBS

1. No OBS, adicione uma fonte **Browser Source**
2. Cole a URL do overlay gerada pelo StreamElements
3. Defina a resolução igual à do overlay (ex: 1920×1080)

---

## 🔐 Permissões

Por padrão, apenas **broadcaster** e **moderadores** podem usar os comandos. Viewers comuns são ignorados automaticamente.

Para ajustar, edite a constante no topo do `widget.js`:

```js
const ALLOWED_ROLES = ['broadcaster', 'moderator'];
```

---

## 💬 Guia de Comandos

### Slot individual

| Comando | Efeito |
|---------|--------|
| `!slot1 pikachu` | Coloca o Pokémon no slot indicado (1–6) |
| `!set slot1 pikachu \| Apelido \| light-ball` | Troca Pokémon, nickname e item de uma vez |
| `!name slot1 Relâmpago` | Define o nickname do Pokémon no slot |
| `!name slot1 clear` | Remove o nickname |
| `!item slot1 light-ball` | Equipa um held item no slot |
| `!item slot1 clear` | Remove o held item |
| `!evolve slot1` | Evolui o Pokémon no slot indicado |
| `!evolve pikachu` | Evolui pelo nome da espécie |
| `!shiny slot1` | Alterna entre sprite normal e shiny |
| `!shiny pikachu` | Alterna shiny pelo nome da espécie |
| `!clear slot1` | Limpa o slot indicado |

> **Dica:** No `!set`, qualquer campo pode ser omitido:
> - `!set slot1 pikachu` → só troca o Pokémon
> - `!set slot1 pikachu \| Bolt` → Pokémon + nickname
> - `!set slot1 \| \| oran-berry` → só troca o item

---

### Time completo

| Comando | Efeito |
|---------|--------|
| `!team bulbasaur, charmander, squirtle` | Monta o time (até 6 Pokémon) |
| `!team p1 \| Apelido \| item, p2 \| Apelido` | Monta o time com nicknames e itens |
| `!clear` | Limpa o time inteiro |
| `!party` | Exibe o time atual no log do widget |

---

### Salvar o time

| Comando | Efeito |
|---------|--------|
| `!save` | Gera o comando `!team` completo com todos os nicknames e itens do time atual e exibe no log |

O comando gerado tem o formato:
```
!team pikachu | Bolt | light-ball, snorlax | Gordão | leftovers
```

Cole esse comando no chat na próxima live para restaurar o time exatamente como estava.

---

## 🎨 Funcionalidades visuais

- **Sprites animadas** — GIFs da Gen 5 (Black & White) com fallback para PNG estático
- **Auto-escala** — sprites pequenas são ampliadas automaticamente para preencher o slot
- **Held items** — ícone do item exibido no canto inferior direito do slot
- **Nicknames** — exibidos em destaque; espécie aparece menor abaixo
- **Shiny** — sprite alternativa com brilho dourado e badge ★
- **Animação de entrada** — bounce ao adicionar um Pokémon
- **Evolução** — flash branco seguido da nova sprite
- **Slots vazios** — pokébola cinza como placeholder

---

## 🔍 Nomes de itens

Os itens usam os slugs da [PokeAPI](https://pokeapi.co/api/v2/item/). Exemplos comuns:

| Item | Slug |
|------|------|
| Leftovers | `leftovers` |
| Life Orb | `life-orb` |
| Choice Band | `choice-band` |
| Choice Specs | `choice-specs` |
| Focus Sash | `focus-sash` |
| Oran Berry | `oran-berry` |
| Light Ball | `light-ball` |
| Rocky Helmet | `rocky-helmet` |

Lista completa em: [pokeapi.co/api/v2/item](https://pokeapi.co/api/v2/item/)

---

## 🔍 Nomes de Pokémon

Use os nomes em inglês e minúsculas conforme a PokeAPI. Exemplos:

| Pokémon | Slug |
|---------|------|
| Pikachu | `pikachu` |
| Charizard | `charizard` |
| Mr. Mime | `mr-mime` |
| Farfetch'd | `farfetchd` |
| Nidoran♀ | `nidoran-f` |
| Nidoran♂ | `nidoran-m` |

---

## 🛠️ Tecnologias

- [PokeAPI](https://pokeapi.co/) — dados e sprites dos Pokémon e itens
- [StreamElements](https://streamelements.com/) — plataforma de overlay
- Sprites animadas: repositório [PokeAPI/sprites](https://github.com/PokeAPI/sprites)

---

## 📄 Licença

MIT — sinta-se livre para usar, modificar e compartilhar.
