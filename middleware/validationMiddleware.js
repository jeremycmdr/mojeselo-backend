const db = require('../config/db');

const PASSWORD_SPECIAL_CHARS = /[!@#$%^&*(),.?":{}|<>]/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Podaci nisu ispravni.',
    errors
  });
};

const addError = (errors, field, message) => {
  errors.push({ field, message });
};

const getTrimmedString = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim();
};

const validateLength = (errors, field, value, min, max, label) => {
  if (!value || value.length < min) {
    addError(errors, field, `${label} mora imati najmanje ${min} karaktera.`);
    return false;
  }

  if (value.length > max) {
    addError(errors, field, `${label} moze imati najvise ${max} karaktera.`);
    return false;
  }

  return true;
};

const parsePositiveInteger = (value) => {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) return null;
  return numberValue;
};

const parsePositiveNumber = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
  return numberValue;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false' || value === undefined || value === null || value === '') {
    return false;
  }
  return null;
};

const validateOptionalUrl = (errors, field, value, label) => {
  const trimmed = getTrimmedString(value);
  if (value === undefined || value === null || trimmed === '') return '';

  if (!trimmed) {
    addError(errors, field, `${label} mora biti tekstualna vrijednost.`);
    return '';
  }

  if (trimmed.length > 1000) {
    addError(errors, field, `${label} moze imati najvise 1000 karaktera.`);
    return '';
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      addError(errors, field, `${label} mora biti http ili https URL.`);
      return '';
    }
  } catch {
    addError(errors, field, `${label} mora biti ispravan URL.`);
    return '';
  }

  return trimmed;
};

const validateOptionalText = (errors, field, value, max, label) => {
  const trimmed = getTrimmedString(value);
  if (value === undefined || value === null || trimmed === '') return '';

  if (!trimmed) {
    addError(errors, field, `${label} mora biti tekstualna vrijednost.`);
    return '';
  }

  if (trimmed.length > max) {
    addError(errors, field, `${label} moze imati najvise ${max} karaktera.`);
    return '';
  }

  return trimmed;
};

const recordExists = async (table, id) => {
  const [rows] = await db.query(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  return rows.length > 0;
};

exports.validateIdParam = (paramName = 'id') => (req, res, next) => {
  const errors = [];
  const id = parsePositiveInteger(req.params[paramName]);

  if (!id) {
    addError(errors, paramName, 'ID mora biti pozitivan cijeli broj.');
    return sendValidationError(res, errors);
  }

  req.params[paramName] = String(id);
  next();
};

exports.validateRegister = (req, res, next) => {
  const errors = [];
  const name = getTrimmedString(req.body.name);
  const email = getTrimmedString(req.body.email);
  const town = getTrimmedString(req.body.town);
  const { password } = req.body;

  validateLength(errors, 'name', name, 2, 64, 'Ime ili naziv domacinstva');

  if (!email || !EMAIL_PATTERN.test(email)) {
    addError(errors, 'email', 'Email adresa nije ispravna.');
  } else if (email.length > 254) {
    addError(errors, 'email', 'Email adresa je predugacka.');
  }

  if (typeof password !== 'string') {
    addError(errors, 'password', 'Lozinka je obavezna.');
  } else {
    if (password.length < 8) addError(errors, 'password', 'Lozinka mora imati najmanje 8 karaktera.');
    if (password.length > 128) addError(errors, 'password', 'Lozinka moze imati najvise 128 karaktera.');
    if (!/[A-Z]/.test(password)) addError(errors, 'password', 'Lozinka mora sadrzati barem jedno veliko slovo.');
    if (!/[0-9]/.test(password)) addError(errors, 'password', 'Lozinka mora sadrzati barem jedan broj.');
    if (!PASSWORD_SPECIAL_CHARS.test(password)) addError(errors, 'password', 'Lozinka mora sadrzati barem jedan specijalni karakter.');
  }

  validateLength(errors, 'town', town, 2, 100, 'Lokacija');

  if (errors.length > 0) return sendValidationError(res, errors);

  req.body.name = name;
  req.body.email = email.toLowerCase();
  req.body.town = town;
  next();
};

exports.validateLogin = (req, res, next) => {
  const errors = [];
  const email = getTrimmedString(req.body.email);
  const { password } = req.body;

  if (!email || !EMAIL_PATTERN.test(email)) {
    addError(errors, 'email', 'Email adresa nije ispravna.');
  }

  if (typeof password !== 'string' || password.length === 0) {
    addError(errors, 'password', 'Lozinka je obavezna.');
  } else if (password.length > 128) {
    addError(errors, 'password', 'Lozinka moze imati najvise 128 karaktera.');
  }

  if (errors.length > 0) return sendValidationError(res, errors);

  req.body.email = email.toLowerCase();
  next();
};

exports.validateProduct = async (req, res, next) => {
  const errors = [];
  const name = getTrimmedString(req.body.name);
  const price = parsePositiveNumber(req.body.price);
  const category = parsePositiveInteger(req.body.category);
  const image = validateOptionalUrl(errors, 'image', req.body.image, 'Slika');
  const description = validateOptionalText(errors, 'description', req.body.description, 2000, 'Opis proizvoda');
  const isOrganic = parseBoolean(req.body.isOrganic);

  validateLength(errors, 'name', name, 2, 120, 'Naziv proizvoda');

  if (!price) {
    addError(errors, 'price', 'Cijena mora biti pozitivan broj.');
  } else if (price > 1000000) {
    addError(errors, 'price', 'Cijena je previsoka.');
  }

  if (!category) {
    addError(errors, 'category', 'Kategorija je obavezna.');
  }

  if (isOrganic === null) {
    addError(errors, 'isOrganic', 'Organski status mora biti true ili false.');
  }

  if (errors.length > 0) return sendValidationError(res, errors);

  try {
    if (!(await recordExists('categories', category))) {
      addError(errors, 'category', 'Kategorija ne postoji.');
    }
  } catch (error) {
    console.error('Greska pri validaciji proizvoda:', error.message);
    return res.status(500).json({ success: false, message: 'Greska pri validaciji.' });
  }

  if (errors.length > 0) return sendValidationError(res, errors);

  req.body.name = name;
  req.body.price = price;
  req.body.category = category;
  req.body.image = image;
  req.body.description = description;
  req.body.isOrganic = isOrganic;
  next();
};

exports.validateTourism = async (req, res, next) => {
  const errors = [];
  const title = getTrimmedString(req.body.title);
  const description = validateOptionalText(errors, 'description', req.body.description, 3000, 'Opis oglasa');
  const image = validateOptionalUrl(errors, 'image', req.body.image, 'Slika');
  const locationId = parsePositiveInteger(req.body.location_id);
  const categoryId = parsePositiveInteger(req.body.category_id);
  let price = null;

  validateLength(errors, 'title', title, 2, 120, 'Naziv oglasa');

  if (req.body.price !== undefined && req.body.price !== null && req.body.price !== '') {
    price = parsePositiveNumber(req.body.price);
    if (!price) {
      addError(errors, 'price', 'Cijena mora biti pozitivan broj ili prazna vrijednost.');
    } else if (price > 1000000) {
      addError(errors, 'price', 'Cijena je previsoka.');
    }
  }

  if (!locationId) {
    addError(errors, 'location_id', 'Lokacija je obavezna.');
  }

  if (!categoryId) {
    addError(errors, 'category_id', 'Kategorija je obavezna.');
  }

  if (errors.length > 0) return sendValidationError(res, errors);

  try {
    const [locationExists, categoryExists] = await Promise.all([
      recordExists('locations', locationId),
      recordExists('tourism_categories', categoryId)
    ]);

    if (!locationExists) addError(errors, 'location_id', 'Lokacija ne postoji.');
    if (!categoryExists) addError(errors, 'category_id', 'Kategorija ne postoji.');
  } catch (error) {
    console.error('Greska pri validaciji turizma:', error.message);
    return res.status(500).json({ success: false, message: 'Greska pri validaciji.' });
  }

  if (errors.length > 0) return sendValidationError(res, errors);

  req.body.title = title;
  req.body.description = description;
  req.body.image = image;
  req.body.price = price;
  req.body.location_id = locationId;
  req.body.category_id = categoryId;
  next();
};

exports.validateChatMessage = async (req, res, next) => {
  const errors = [];
  const receiverId = parsePositiveInteger(req.body.receiverId);
  const messageText = getTrimmedString(req.body.messageText);

  if (!receiverId) {
    addError(errors, 'receiverId', 'Primalac je obavezan.');
  } else if (req.user && Number(req.user.id) === receiverId) {
    addError(errors, 'receiverId', 'Ne mozete poslati poruku sami sebi.');
  }

  validateLength(errors, 'messageText', messageText, 1, 1000, 'Poruka');

  if (errors.length > 0) return sendValidationError(res, errors);

  try {
    if (!(await recordExists('users', receiverId))) {
      addError(errors, 'receiverId', 'Primalac nije pronadjen.');
    }
  } catch (error) {
    console.error('Greska pri validaciji poruke:', error.message);
    return res.status(500).json({ success: false, message: 'Greska pri validaciji.' });
  }

  if (errors.length > 0) return sendValidationError(res, errors);

  req.body.receiverId = receiverId;
  req.body.messageText = messageText;
  next();
};
