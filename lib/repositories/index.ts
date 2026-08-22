import type { SupabaseClient } from "./base";
import { ProductsRepository } from "./products";
import { CustomersRepository } from "./customers";
import { TablesRepository } from "./tables";
import { OrdersRepository } from "./orders";
import { DebtsRepository } from "./debts";
import { GiftCardsRepository } from "./gift_cards";
import { PaymentsRepository } from "./payments";
import { WalletsRepository } from "./wallets";
import { ExpensesRepository } from "./expenses";
import { MatchesRepository } from "./matches";

export class RepositoryFactory {
  constructor(private client: SupabaseClient) {}

  get products() { return new ProductsRepository(this.client); }
  get customers() { return new CustomersRepository(this.client); }
  get tables() { return new TablesRepository(this.client); }
  get orders() { return new OrdersRepository(this.client); }
  get debts() { return new DebtsRepository(this.client); }
  get giftCards() { return new GiftCardsRepository(this.client); }
  get payments() { return new PaymentsRepository(this.client); }
  get wallets() { return new WalletsRepository(this.client); }
  get expenses() { return new ExpensesRepository(this.client); }
  get matches() { return new MatchesRepository(this.client); }
}

export { ProductsRepository, CustomersRepository, TablesRepository, OrdersRepository, DebtsRepository, GiftCardsRepository, PaymentsRepository, WalletsRepository, ExpensesRepository, MatchesRepository };
export { RepositoryError, isSupabaseConfigured, safeQuery } from "./base";
export type { CheckoutInput } from "./orders";
export {
  mapProductFromDb, mapProductToDb, mapCustomerFromDb, mapCustomerToDb,
  mapTableFromDb, mapSaleFromDb, mapGiftCardFromDb, mapDebtFromDb,
  mapExpenseFromDb, mapStaffFromDb, mapMatchFromDb, mapStockMovementFromDb
} from "./mappers";
