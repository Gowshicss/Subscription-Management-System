# Brightloop Subscription Management System — Role & Permission Matrix

## 1. Role Definitions
1. **ADMIN**: Brightloop executives and system administrators with unrestricted operational and governance permissions.
2. **STAFF**: Brightloop internal sales, customer service, and accounting staff with customer operations, quote creation, and payment recording authority.
3. **CUSTOMER**: Self-service portal user representing a client company subscribing to Brightloop offerings.

---

## 2. Granular Permissions Matrix

| Domain | Action / Endpoint | Admin | Staff | Customer |
| :--- | :--- | :---: | :---: | :---: |
| **Auth** | Register customer account | Yes | Yes | Public |
| | Login / Logout | Yes | Yes | Yes |
| | Reset password via token | Yes | Yes | Yes |
| | Create internal staff account | **Yes** | **No** | **No** |
| | List & manage staff accounts | **Yes** | **No** | **No** |
| **Customers** | List all customers | Yes | Yes | No |
| | View customer profile | Yes | Yes | Own only |
| | Update customer profile | Yes | Yes | Own only |
| **Products** | List products & variants | Yes | Yes | Public / Auth |
| | Create, update, archive products | **Yes** | **No** | **No** |
| | Manage product variants | **Yes** | **No** | **No** |
| **Plans** | List subscription plans | Yes | Yes | Public / Auth |
| | Create, update, archive plans | **Yes** | **No** | **No** |
| **Taxes** | Create & configure tax rules | **Yes** | **No** | **No** |
| | View tax rates | Yes | Yes | Embedded in docs |
| **Discounts** | Create & configure discount rules | **Yes** | **No** | **No** |
| | View discount rules | Yes | Yes | Applied on invoice |
| **Quotes** | Create quotation template | Yes | Yes | No |
| | Create customer quotation | Yes | Yes | No |
| | Send quotation | Yes | Yes | No |
| | View quotations | Yes | Yes | Own only |
| | Accept quotation | No | No | **Own only** |
| | Convert quote to subscription | Yes | Yes | Triggered on accept |
| **Subscriptions** | View all subscriptions | Yes | Yes | Own only |
| | View subscription detail | Yes | Yes | Own only |
| | Pause subscription | Yes (if plan allows) | Yes (if plan allows) | Yes (if plan allows) |
| | Resume subscription | Yes | Yes | Yes |
| | Close subscription | Yes | Yes | If early close allowed |
| | Renew subscription | Yes (if plan allows) | Yes (if plan allows) | Yes (if plan allows) |
| **Invoicing** | View all invoices | Yes | Yes | Own only |
| | Trigger automated billing run | **Yes** | **No** | **No** |
| | Confirm / Cancel draft invoice | Yes | Yes | No |
| | Download invoice PDF | Yes | Yes | Own only |
| **Payments** | Record payment against invoice | **Yes** | **Yes** | **No** |
| | View payment records | Yes | Yes | Own only |
| **Dashboard** | View business finance analytics | **Yes** | Restricted Ops | Self Overview |
| **Settings** | Update business configuration | **Yes** | **No** | **No** |

