const { User } = await import('./user.mjs');
const user = await new User();

const { Render } = await import('./render.mjs');
Render.initialise();

if(await user.validate()) {

  /**
   * If this is the first visit of the user to this site on this device, display a welcome notice 
   * and a button for them to accept. If they do not accept with a button click, do not 
   * continue. Keep showing this welcome notice on every visit until the button is clicked for 
   * acceptance. This is similar to the cookie notice that is on every website these days. All 
   * other information on the site is hidden until the welcome notice accepted.
   */
  if(await user.welcome()) {
    new Render('user-welcome', document.querySelector('aside'), [user.firstname])
  }
  
  /**
   * While waiting for the welcome notice to be accepted, carry one with building the user's 
   * database in the background, and then carry on building the page sections thereafter.
   */
  const { DB } = await import('./db.mjs');
  await DB.build();
  let today = new DB(DB.today, user);

   /**
   * Build the alert section of page. It has exactly the same text as the emails that are sent 
   * out so that the user can readily associate the email message with this site.
   */
  new Render('strategy-alert', document.querySelector('main'), today)

  /**
   * Render the market status section of the page. Only show the markets of the strategies that the 
   * user is licensed to. OHLC, volume, and %change over various periods is shown.
   */ 
  new Render('market-status', document.querySelector('main'), today, user);

  // Strategy status header
  new Render('strategy-status-header', document.querySelector('main'), [today.date]);
  
  console.log(today);

  /**
   * Render the strategy status section of the page. Only show the strategies that the user is 
   * licensed to. All position, action, and instrument details of the strategy are shown.
   */ 
  today['strategy-status'].forEach((strategy, index) => {
    new Render('strategy-status', document.querySelector('main'), strategy, user);
  })

} else {

  /**
   * Unauthorised access. There was either no id provided or an unregistered id, so the user is not 
   * permitted to access the private data on this site.
   */
  new Render('user-unauthorised', document.querySelector('aside'))

}