jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const { query } = require('../../config/database');
const pageService = require('../../modules/pages/page.service.simple');

describe('page.service.simple slug handling', () => {
  beforeEach(() => {
    query.mockReset();
  });

  test('createPage normalizes path-like slugs before storing', async () => {
    let insertValues = null;

    query.mockImplementation(async (sql, values = []) => {
      if (sql.startsWith('SELECT _id, slug FROM pages')) {
        return [];
      }

      if (sql.startsWith('INSERT INTO pages')) {
        insertValues = values;
        return [];
      }

      if (sql.startsWith('SELECT * FROM pages WHERE _id = ?')) {
        return [
          {
            _id: values[0],
            title: insertValues[1],
            slug: insertValues[2],
            redirect_url: insertValues[3],
            css: insertValues[4],
            content: insertValues[5],
            status: insertValues[6],
            departmentId: insertValues[7],
            author: insertValues[8],
            updatedBy: insertValues[9],
            publishedAt: insertValues[10],
            scheduledAt: insertValues[11],
            versions: insertValues[12],
            tags: insertValues[13],
            announcement: insertValues[14],
            createdAt: insertValues[15],
            updatedAt: insertValues[16],
          },
        ];
      }

      return [];
    });

    const created = await pageService.createPage({
      title: { en: 'About Team', kn: '' },
      slug: ' /About Us/Team ',
      content: {
        en: { html: '<h1>Team</h1>', javascript: '' },
        kn: { html: '', javascript: '' },
      },
      tags: ['custom'],
    });

    expect(insertValues).not.toBeNull();
    expect(insertValues[2]).toBe('about-us/team');
    expect(created.slug).toBe('about-us/team');
  });

  test('getPageBySlug resolves normalized route paths', async () => {
    const storedRow = {
      _id: 'page-1',
      title: JSON.stringify({ en: 'About Team', kn: '' }),
      slug: 'about-us/team',
      redirect_url: '',
      css: '',
      content: JSON.stringify({
        en: { html: '<h1>Team</h1>', javascript: '' },
        kn: { html: '', javascript: '' },
      }),
      status: 'approved',
      departmentId: null,
      author: 'user-1',
      updatedBy: null,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      scheduledAt: null,
      versions: '[]',
      tags: '[]',
      announcement: 'null',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    query.mockImplementation(async (sql, values = []) => {
      if (!sql.includes('FROM pages')) {
        return [];
      }

      if (sql.includes('WHERE slug = ?')) {
        if (values[0] === 'about-us/team' || values[0] === '/about-us/team') {
          return [storedRow];
        }
        return [];
      }

      if (sql.includes('LOWER(status) IN (\'approved\', \'published\')')) {
        return [storedRow];
      }

      return [];
    });

    const page = await pageService.getPageBySlug('/About Us/Team');

    expect(page).toBeTruthy();
    expect(page.slug).toBe('about-us/team');
    expect(query.mock.calls.some(([sql, values]) => sql.includes('WHERE slug = ?') && values[0] === 'about-us/team')).toBe(true);
  });
});
