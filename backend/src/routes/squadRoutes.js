const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/squadController");

router.get("/state", auth, ctrl.getSquadState);
router.put("/state", auth, ctrl.saveSquadState);
router.get("/requests", auth, ctrl.getConnectionRequests);
router.post("/connect-request", auth, ctrl.sendConnectionRequest);
router.post("/requests/:requestId/respond", auth, ctrl.respondToConnectionRequest);
router.post("/dm/start", auth, ctrl.startDirectMessage);
router.get("/:squadId/messages", auth, ctrl.getSquadMessages);
router.post("/messages", auth, ctrl.sendDirectMessage);
router.post("/:squadId/messages", auth, ctrl.postSquadMessage);

module.exports = router;
