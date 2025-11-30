// ========================================
// GCL LEXICAL SCANNER
// Version: Final
// ========================================

// ===== TOKEN DEFINITIONS =====

const KEYWORDS = {
    'if': 'KEYWORD',
    'then': 'KEYWORD',
    'else': 'KEYWORD',
    'fi': 'KEYWORD',
    'do': 'KEYWORD',
    'od': 'KEYWORD',
    'skip': 'KEYWORD',
    'int': 'KEYWORD',
    'mod': 'KEYWORD'
};

const SYMBOLS = {
    '(': 'LPAREN',
    ')': 'RPAREN',
    '{': 'LBRACE',
    '}': 'RBRACE',
    '[': 'LBRACKET',
    ']': 'RBRACKET',
    ';': 'SEMICOLON',
    ':': 'COLON',
    ',': 'COMMA',
    '.': 'DOT',
    '|': 'PIPE',
    '[]': 'LSQUAREBRACKET'
};

const OPERATORS = {
    // Assignment & Control
    '←': 'ASSIGN',
    ':=': 'ASSIGN_ALT',
    '→': 'ARROW',
    '|': 'ALT_SEP',
    
    // Comparison
    '=': 'EQ',
    '<': 'LT',
    '>': 'GT',
    '≤': 'LEQ',
    '≥': 'GEQ',
    '≠': 'NEQ',
    
    // Logical
    '¬': 'NOT',
    '∧': 'AND',
    '∨': 'OR',
    
    // Arithmetic
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'MULT',
    '/': 'DIV',
    '^': 'POW'
};

// ===== LEXER CLASS =====

class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.tokens = [];
    }

    peek(offset = 0) {
        const p = this.pos + offset;
        return p < this.input.length ? this.input[p] : null;
    }

    advance() {
        if (this.input[this.pos] === '\n') {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        this.pos++;
    }

    skipWhitespace() {
        while (this.peek() && /\s/.test(this.peek())) {
            this.advance();
        }
    }

    skipComment() {
        // Skip line comments: // atau #
        if ((this.peek() === '/' && this.peek(1) === '/') || this.peek() === '#') {
            while (this.peek() && this.peek() !== '\n') {
                this.advance();
            }
        }
        // Skip block comments: /* ... */
        if (this.peek() === '/' && this.peek(1) === '*') {
            this.advance();
            this.advance();
            while (this.peek()) {
                if (this.peek() === '*' && this.peek(1) === '/') {
                    this.advance();
                    this.advance();
                    break;
                }
                this.advance();
            }
        }
    }

    readNumber() {
        let num = '';
        while (this.peek() && /\d/.test(this.peek())) {
            num += this.peek();
            this.advance();
        }
        return num;
    }

    readIdentifier() {
        let id = '';
        while (this.peek() && /[a-zA-Z0-9_']/.test(this.peek())) {
            id += this.peek();
            this.advance();
        }
        return id;
    }

    addToken(lexeme, type, line, col) {
        this.tokens.push({
            lexeme,
            type,
            line,
            col
        });
    }

    scan() {
        while (this.pos < this.input.length) {
            this.skipWhitespace();
            this.skipComment();
            
            if (this.pos >= this.input.length) break;

            const startLine = this.line;
            const startCol = this.col;
            const ch = this.peek();

            // ===== Multi-character operators (2-char) =====
            if (ch === '←' || ch === '→' || ch === '≤' || ch === '≥' || ch === '≠') {
                const op = ch;
                this.advance();
                this.addToken(op, OPERATORS[op], startLine, startCol);
            }
            // ===== Alternative separator [] =====
            else if (ch === '[' && this.peek(1) === ']') {
                this.advance();
                this.advance();
                this.addToken('[]', 'ALT_SEP', startLine, startCol);
            }
            // ===== Logical operators =====
            else if (ch === '¬' || ch === '∧' || ch === '∨') {
                const op = ch;
                this.advance();
                this.addToken(op, OPERATORS[op], startLine, startCol);
            } 
            // ===== Single-char symbols =====
            else if (SYMBOLS[ch]) {
                this.advance();
                this.addToken(ch, SYMBOLS[ch], startLine, startCol);
            } 
            // ===== Single-char operators =====
            else if (OPERATORS[ch]) {
                this.advance();
                this.addToken(ch, OPERATORS[ch], startLine, startCol);
            } 
            // ===== Numbers =====
            else if (/\d/.test(ch)) {
                const num = this.readNumber();
                this.addToken(num, 'NUMBER', startLine, startCol);
            } 
            // ===== Identifiers & Keywords =====
            else if (/[a-zA-Z_]/.test(ch)) {
                const id = this.readIdentifier();
                const type = KEYWORDS[id] || 'IDENTIFIER';
                this.addToken(id, type, startLine, startCol);
            }
            // ===== String literals (optional) =====
            else if (ch === '"' || ch === "'") {
                const quote = ch;
                this.advance();
                let str = '';
                while (this.peek() && this.peek() !== quote) {
                    if (this.peek() === '\\') {
                        this.advance();
                        if (this.peek()) {
                            str += this.peek();
                            this.advance();
                        }
                    } else {
                        str += this.peek();
                        this.advance();
                    }
                }
                if (this.peek() === quote) {
                    this.advance();
                }
                this.addToken(quote + str + quote, 'STRING', startLine, startCol);
            }
            // ===== Unknown character =====
            else {
                throw new Error(`❌ Karakter tidak dikenali: '${ch}' (Unicode: ${ch.charCodeAt(0)}) di baris ${startLine}, kolom ${startCol}`);
            }
        }
        
        this.addToken('EOF', 'EOF', this.line, this.col);
        return this.tokens;
    }
}

// ===== MAIN FUNCTION =====

function scanTokens() {
    const input = document.getElementById('gcl-input').value;
    const errorDiv = document.getElementById('error-message');
    const tokensBody = document.getElementById('tokens-body');

    errorDiv.classList.remove('show');
    tokensBody.innerHTML = '';

    try {
        if (!input.trim()) {
            errorDiv.textContent = '⚠️ Masukkan kode GCL terlebih dahulu!';
            errorDiv.classList.add('show');
            return;
        }

        const lexer = new Lexer(input);
        const tokens = lexer.scan();

        if (tokens.length === 1 && tokens[0].type === 'EOF') {
            errorDiv.textContent = '⚠️ Tidak ada token ditemukan.';
            errorDiv.classList.add('show');
            return;
        }

        tokens.forEach((token, idx) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align: center; font-weight: 500;">${idx + 1}</td>
                <td><code>${escapeHtml(token.lexeme)}</code></td>
                <td><span style="background-color: #e3f2fd; padding: 4px 8px; border-radius: 3px; font-weight: 500; display: inline-block;">${token.type}</span></td>
                <td style="text-align: center;">${token.line}</td>
                <td style="text-align: center;">${token.col}</td>
            `;
            tokensBody.appendChild(row);
        });

    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.classList.add('show');
    }
}

// ===== HELPER FUNCTION =====

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('gcl-input');
    if (textarea) {
        textarea.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                scanTokens();
            }
        });
    }
});
