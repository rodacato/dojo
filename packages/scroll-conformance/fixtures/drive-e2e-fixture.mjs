// Drive module for the e2e fixture scroll (apps/e2e/fixtures/scroll): clicks inside the frame so the suite sees progress and complete.
export default async function drive(page) {
  const frame = page.frameLocator('#scroll-frame')
  await frame.locator('#progress').click()
  await frame.locator('#complete').click()
}
