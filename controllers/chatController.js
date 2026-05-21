const db = require('../config/db');

// @desc    Preuzmi sve konverzacije ulogovanog korisnika
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  const myId = req.user.id;

  try {
    const query = `
      SELECT 
        c.id AS conversation_id,
        c.created_at,
        c.updated_at,
        u.id AS other_user_id,
        u.name AS other_user_name,
        u.email AS other_user_email,
        lm.message_text AS last_message,
        lm.created_at AS last_message_time,
        lm.sender_id AS last_message_sender_id,
        (
          SELECT COUNT(*) 
          FROM messages m 
          WHERE m.conversation_id = c.id 
            AND m.sender_id != ? 
            AND m.is_read = 0
        ) AS unread_count
      FROM conversations c
      JOIN users u ON u.id = IF(c.user_one_id = ?, c.user_two_id, c.user_one_id)
      LEFT JOIN (
        SELECT m1.*
        FROM messages m1
        INNER JOIN (
          SELECT conversation_id, MAX(id) as max_id
          FROM messages
          GROUP BY conversation_id
        ) m2 ON m1.id = m2.max_id
      ) lm ON lm.conversation_id = c.id
      WHERE c.user_one_id = ? OR c.user_two_id = ?
      ORDER BY c.updated_at DESC
    `;

    const [conversations] = await db.query(query, [myId, myId, myId, myId]);

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju konverzacija:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};

// @desc    Preuzmi sve poruke iz konverzacije
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
  const myId = req.user.id;
  const conversationId = req.params.id;

  try {
    // 1. Proveri da li konverzacija pripada korisniku
    const [convs] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (user_one_id = ? OR user_two_id = ?)',
      [conversationId, myId, myId]
    );

    if (convs.length === 0) {
      return res.status(403).json({ success: false, message: 'Nemate pristup ovoj konverzaciji.' });
    }

    // 2. Označi dolazne poruke kao pročitane
    await db.query(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0',
      [conversationId, myId]
    );

    // 3. Preuzmi sve poruke
    const [messages] = await db.query(
      'SELECT id, conversation_id, sender_id, message_text, is_read, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('❌ Greška pri preuzimanju poruka:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};

// @desc    Pošalji novu poruku korisniku (automatski kreira konverzaciju ako ne postoji)
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, messageText } = req.body;

  if (!receiverId || !messageText || messageText.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nedostaje primalac ili tekst poruke.' });
  }

  if (Number(senderId) === Number(receiverId)) {
    return res.status(400).json({ success: false, message: 'Ne možete poslati poruku sami sebi.' });
  }

  try {
    // 1. Proveri da li primalac postoji
    const [users] = await db.query('SELECT id, name FROM users WHERE id = ?', [receiverId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Primalac nije pronađen.' });
    }

    // 2. Pronađi ili kreiraj konverzaciju
    const userOneId = Math.min(senderId, receiverId);
    const userTwoId = Math.max(senderId, receiverId);

    const [convs] = await db.query(
      'SELECT id FROM conversations WHERE user_one_id = ? AND user_two_id = ?',
      [userOneId, userTwoId]
    );

    let conversationId;

    if (convs.length > 0) {
      conversationId = convs[0].id;
    } else {
      // Kreiraj novu konverzaciju
      const [newConv] = await db.query(
        'INSERT INTO conversations (user_one_id, user_two_id) VALUES (?, ?)',
        [userOneId, userTwoId]
      );
      conversationId = newConv.insertId;
    }

    // 3. Upis poruke u bazu
    const [result] = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)',
      [conversationId, senderId, messageText.trim()]
    );

    // 4. Ažuriraj updated_at u konverzaciji da bi skočila na vrh
    await db.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        conversation_id: conversationId,
        sender_id: senderId,
        message_text: messageText.trim(),
        is_read: 0,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Greška pri slanju poruke:', error.message);
    res.status(500).json({ success: false, message: 'Greška na serveru.' });
  }
};
