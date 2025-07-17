const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getMembers,
  updateMemberRole,
  removeMember
} = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

router.get('/', getGroups);
router.get('/:id', getGroup);
router.get('/:id/members', getMembers);

router.use(authenticate);

router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.put('/:id/members/:userId/role', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

module.exports = router; 