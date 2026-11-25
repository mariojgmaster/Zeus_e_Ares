import {test,expect} from '@playwright/test';
for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
 test('aquarium '+viewport.width,async({page})=>{
  await page.setViewportSize(viewport);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#profiles')).toBeVisible({timeout:30000});
  await expect(page.locator('#depthMode')).toBeVisible();
  await expect(page.locator('#tank')).toBeVisible();
  await page.locator('#feed').click();
  await page.locator('#night').click();await expect(page.locator('#night')).toHaveAttribute('aria-pressed','true');
  await page.locator('#depthMode').click();await expect(page.locator('#depthMode')).toHaveAttribute('aria-pressed','false');
  await page.locator('#inspect').click();await expect(page.locator('#rotate')).toBeVisible();
  await page.locator('#photo').click();await expect(page.locator('#photoPanel')).toBeVisible();
  await page.locator('#photoClose').click();await expect(page.locator('#photoPanel')).toBeHidden();
  await page.locator('#profiles').click();await expect(page.getByRole('dialog',{name:'Perfis dos peixes'})).toBeVisible();
  await page.getByRole('button',{name:'Voltar ao aquário'}).click();
  expect(errors).toEqual([]);
 });
}
