pub struct BannerState;

impl Default for BannerState {
    fn default() -> Self {
        const ASCII_ART: &str = r#"
        ___                         
       /   |  _________ ___  _______
      / /| | / ___/ __ `/ / / / ___/
     / ___ |/ /  / /_/ / /_/ (__  ) 
    /_/  |_/_/   \__, /\__,_/____/  
                /____/              
    "#;

        println!("{}", ASCII_ART);
        println!("v{}", env!("CARGO_PKG_VERSION"));

        Self {}
    }
}
