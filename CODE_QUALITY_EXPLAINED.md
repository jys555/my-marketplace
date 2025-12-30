# 🔍 Code Quality - ESLint va Prettier

## ❓ Code Quality Nima?

**Code Quality** - Bu kodning tozaligi, o'qilishi va standartlarga mosligi.

**Misol:**
- Kod standartlarga mosmi?
- O'qilishi osonmi?
- Xatolar bormi?
- Format bir xilmi?

---

## 🎯 Code Quality Nega Kerak?

### 1. **Consistency (Bir xillik)** 📏

**Muammo:**
- Har bir developer o'z usulida kod yozadi
- Kod format turli-tuman
- O'qish qiyin

**Hal qilish:**
- ESLint - kod standartlarini tekshiradi
- Prettier - kodni format qiladi
- Barcha kod bir xil format ✅

---

### 2. **Error Prevention** 🐛

**Muammo:**
- Potensial xatolar kodda qoladi
- Type error'lar
- Undefined variable'lar

**Hal qilish:**
- ESLint xatolarni topadi
- Real-time checking
- CI/CD'da check ✅

---

### 3. **Code Readability** 📚

**Muammo:**
- Kod o'qish qiyin
- Format noto'g'ri
- Inconsistent style

**Hal qilish:**
- Prettier avtomatik format
- ESLint best practices
- Oson o'qiladi ✅

---

## 🛠️ ESLint - Nima?

**ESLint** - JavaScript kod'ni tekshiradigan tool (linter).

**Nima qiladi:**
- Kod xatolarini topadi
- Best practices'ni tekshiradi
- Standartlarga mosligini tekshiradi
- Real-time warning'lar

**Misol:**
```javascript
// ESLint error:
const x = 5; // 'x' is assigned but never used

// ESLint warning:
if (condition) { // Unexpected console statement
    console.log('debug');
}
```

---

## 🎨 Prettier - Nima?

**Prettier** - Kod'ni avtomatik format qiladigan tool (formatter).

**Nima qiladi:**
- Kod'ni avtomatik format qiladi
- Consistent style
- Semicolon, quotes, indentation

**Misol:**
```javascript
// Before Prettier:
const x={a:1,b:2}
if(condition){
doSomething()
}

// After Prettier:
const x = { a: 1, b: 2 };
if (condition) {
    doSomething();
}
```

---

## 📋 Setup Plan

### Step 1: ESLint Installation ✅

**Packages:**
- `eslint` - ESLint core
- `eslint-config-standard` - Standard rules
- `eslint-plugin-node` - Node.js rules

---

### Step 2: Prettier Installation ✅

**Packages:**
- `prettier` - Prettier core
- `eslint-config-prettier` - ESLint bilan conflict'larni oldini oladi

---

### Step 3: Configuration Files ✅

**Fayllar:**
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Prettier ignore files

---

### Step 4: package.json Scripts ✅

**Scripts:**
- `npm run lint` - ESLint check
- `npm run lint:fix` - ESLint fix
- `npm run format` - Prettier format
- `npm run format:check` - Prettier check

---

## 🎯 ESLint Rules

### Common Rules:

**Errors:**
- `no-unused-vars` - Unused variables
- `no-undef` - Undefined variables
- `no-console` - Console statements (production)
- `no-var` - Use `let`/`const` instead of `var`

**Best Practices:**
- `eqeqeq` - Use `===` instead of `==`
- `curly` - Always use curly braces
- `no-eval` - No eval()

---

## 🎨 Prettier Options

### Common Options:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## 💰 Xarajat

**Code Quality Tools:**
- ✅ Development tool'lar (free)
- ✅ CI/CD integration (free)
- ✅ Performance impact: MINIMAL (faqat development'da)

**Xarajat:** 💰 (FREE!)

---

## 🎯 Integration

### Editor Integration:
- VSCode extensions
- Auto-format on save
- Real-time linting

### CI/CD Integration:
- Pre-commit hooks
- GitHub Actions
- Automated checks

---

**Status:** ⏭️ Code Quality setup boshlanmoqda! 🚀
