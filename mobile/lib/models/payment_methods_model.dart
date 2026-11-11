/// `GET /payments/methods`: payment methods enabled on the server, plus the bank account
/// used for BANK_TRANSFER instructions.
library;

class BankTransferConfig {
  final String bankName;
  final String accountNumber;
  final String accountHolder;

  const BankTransferConfig({
    required this.bankName,
    required this.accountNumber,
    required this.accountHolder,
  });

  factory BankTransferConfig.fromJson(Map<String, dynamic> json) => BankTransferConfig(
        bankName: '${json['bankName'] ?? ''}'.trim(),
        accountNumber: '${json['accountNumber'] ?? ''}'.trim(),
        accountHolder: '${json['accountHolder'] ?? ''}'.trim(),
      );

  bool get hasAccount => accountNumber.isNotEmpty;

  /// Account holder shown to the customer (same fallback as the web checkout).
  String get displayHolder => accountHolder.isNotEmpty ? accountHolder : 'TRUONG THANH BOOKSTORE';

  /// VietQR image for this order, built exactly like the web success screen.
  String vietQrUrl({required num amount, required String orderCode}) {
    final bank = Uri.encodeComponent(bankName.isNotEmpty ? bankName : 'MB');
    final account = Uri.encodeComponent(accountNumber);
    return 'https://img.vietqr.io/image/$bank-$account-compact2.png'
        '?amount=${amount.round()}'
        '&addInfo=${Uri.encodeComponent(orderCode)}'
        '&accountName=${Uri.encodeComponent(displayHolder)}';
  }
}

class PaymentMethodsConfig {
  static const String methodCod = 'COD';
  static const String methodBankTransfer = 'BANK_TRANSFER';
  static const String methodVnpay = 'VNPAY';
  static const String methodMomo = 'MOMO';
  static const List<String> known = [methodCod, methodBankTransfer, methodVnpay, methodMomo];

  /// COD only: what the app falls back to when the server list cannot be loaded.
  static const PaymentMethodsConfig codOnly = PaymentMethodsConfig(methods: [methodCod]);

  final List<String> methods;
  final BankTransferConfig? bankTransfer;

  const PaymentMethodsConfig({required this.methods, this.bankTransfer});

  factory PaymentMethodsConfig.fromJson(Map<String, dynamic> json) {
    final raw = json['methods'];
    final methods = raw is List
        ? raw.map((m) => '$m'.toUpperCase()).where(known.contains).toList()
        : <String>[];
    final bank = json['bankTransfer'];
    return PaymentMethodsConfig(
      methods: methods.isEmpty ? const [methodCod] : methods,
      bankTransfer: bank is Map ? BankTransferConfig.fromJson(Map<String, dynamic>.from(bank)) : null,
    );
  }

  /// Methods the current user may pick, in display order. The backend only accepts COD
  /// from guests, so guests never see online methods (same rule as the web checkout).
  List<String> availableFor({required bool isAuthenticated}) => known
      .where(methods.contains)
      .where((m) => isAuthenticated || m == methodCod)
      .toList();

  static bool isOnlineGateway(String method) => method == methodVnpay || method == methodMomo;
}
