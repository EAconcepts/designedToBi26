import { expect, test } from '@playwright/test';

const E2E_GUEST_CODE = 'e2e9test';

test('a valid invitation link stores a cookie and personalises the invitation', async ({
  page,
  context,
}) => {
  await page.goto(`/i/${E2E_GUEST_CODE}`);
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Dear E2E Deterministic Guest')).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.name === 'guest_session')).toBe(true);
});

test('an unknown invitation link redirects without creating a guest cookie', async ({
  page,
  context,
}) => {
  await page.goto('/i/zzzzzzzz');
  await expect(page).toHaveURL('/');
  expect((await context.cookies()).some((cookie) => cookie.name === 'guest_session')).toBe(false);
});
