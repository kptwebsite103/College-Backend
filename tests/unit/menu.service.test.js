const menuService = require('../../modules/menu/menu.service');

jest.mock('../../modules/menu/menu.model', () => ({
  exists: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Menu = require('../../modules/menu/menu.model');

describe('menu.service', () => {
  beforeEach(() => jest.resetAllMocks());

  test('createMenu throws 409 when slug exists', async () => {
    Menu.exists.mockResolvedValue(true);
    await expect(menuService.createMenu({ name: { en: 'A' }, slug: 'dup' })).rejects.toMatchObject({ status: 409 });
  });

  test('updateMenu throws 409 when slug belongs to another doc', async () => {
    Menu.findOne.mockResolvedValue({ _id: 'otherId' });
    await expect(menuService.updateMenu('myId', { slug: 'dup' })).rejects.toMatchObject({ status: 409 });
  });
});