Secure Multiparty Computation (SMPC) Simulator

An interactive, educational web-based simulator that demonstrates how secrets can be securely distributed and reconstructed using Additive Secret Sharing and Shamir’s Secret Sharing protocols.

This project helps students understand the mathematical and cryptographic concepts behind Secure Multiparty Computation through step-by-step visualizations.


Features
- Supports Additive Secret Sharing (modular arithmetic based)
- Supports Shamir Secret Sharing (polynomial & Lagrange interpolation)
- Interactive Visualizations: Dynamic Flowcharts for Additive Sharing
- Interactive Visualizations: Chart.js Graphing for Shamir Polynomials
- Step-by-step numerical simulation of secret reconstruction
- Real-time protocol flow visualization
- Input validation (prime modulus, thresholds, etc.)
- Keyboard shortcuts for fast interaction
- Responsive UI using Bootstrap 5


Concepts Covered
- Modular Arithmetic  
- Prime Modulus Operations  
- Polynomial-based Secret Sharing  
- Lagrange Interpolation  
- Threshold Cryptography  
- Secure Reconstruction of Secrets  


Technologies Used
- HTML5  
- CSS3  
- JavaScript (ES6)  
- Bootstrap 5  
- Cryptographic Math (Modular Inverse, Exponentiation)  


How to Run the Project

1. Download or Clone the Repository
   git clone https://github.com/vinay24156/Secure-Multiparty-Computation-Protocol-Simulator

2. Open the Simulator  
   Open SMPC.html in any modern browser (Chrome, Firefox, Edge).

3. Choose a Protocol  
   - Additive Sharing  
   - Shamir Secret Sharing  

4. Enter Inputs  
   - Secret value  
   - Number of parties  
   - Threshold (for Shamir)  
   - Prime modulus  

5. Run the Simulation  
   Press "Run Next Step (S)"  
   View step-by-step results  


Keyboard Shortcuts

S  - Run next step  
R  - Reset simulation  
H  - Scroll to top / Help  


Example

Additive Sharing Example:

Secret S = 123, n = 3, p = 257  
Shares: [50, 70, 3]  
Reconstruction: (50 + 70 + 3) mod 257 = 123  

Shamir Sharing Example:

Secret S = 42, t = 2, n = 3  
Polynomial: f(x) = 42 + 15x  
Shares: (1,57), (2,72), (3,87)  
Reconstruction using Lagrange Interpolation → 42  


Purpose of the Project

This simulator is built for:
- Students learning Cryptography
- Understanding Secure Multiparty Computation
- Visualizing Secret Sharing Algorithms
- Practicing Mathematical Security Concepts

Note: This tool is for educational purposes only, not for production cryptographic use.


Project Structure

SMPC/
|
|-- SMPC.html        (Main simulator UI)
|-- manual.html      (User manual)
|-- SMPC.css         (Styling)
|-- SMPC.js          (Simulation logic)
|-- README.txt       (Project documentation)


Author

Vinay Kumar Kode  
Computer Science (Cybersecurity) Student  
India  

GitHub: https://github.com/vinay24156  
LinkedIn: https://www.linkedin.com/in/vinay-kumar-kode-905aab320/  


If you like this project, give it a star on GitHub!
