const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ai = require('../controllers/aiController');

router.post('/matchmaker-filters', ai.postMatchmakerFilters);
router.post('/matchmaker', ai.postMatchmakerScore);
router.post('/matchmaker/score', ai.postMatchmakerScore);
router.post('/generate', ai.postGenerate);
router.post('/chat', ai.postChat);
router.post('/draft', ai.postDraft);
router.post('/icebreaker', ai.postIcebreaker);

module.exports = router;
