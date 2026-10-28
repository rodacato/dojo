// Conformance drive module: clicks through the reference scroll so progress, complete and run are audited too.
export default async function drive(page) {
  const frame = page.frameLocator('#scroll-frame')
  await frame.locator('#mode:text-is("embedded")').waitFor()
  await frame.locator('#progress').click()
  await frame.locator('#complete').click()
  await frame.locator('#run').click()
  await frame.locator('#output:text-matches("^(ok|error)")').waitFor()
}
