(async () => {
  try {
    const bcrypt = require("bcrypt");
    const hash = "$2b$10$BYODPiNUUKoPrFPVHqFftu.Fwh4ze9Ly8ApuLk6Ebg6QCs03q1JAu";
    console.log(
      "devpassword123 match?",
      await bcrypt.compare("devpassword123", hash),
    );
    console.log("123456 match?", await bcrypt.compare("123456", hash));
  } catch (e) {
    console.error("error", e);
  }
})();
