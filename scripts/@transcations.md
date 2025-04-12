@transcations
desc, category, cash/credit, account, amount, date

@transcations
flight to barwaha, Travel, credit, SBI, 6494, 23 feb 25
sbi etf, Investments, cash, SBI, 10000, 28 feb 25



function handle_component_transcations(){

}
above function parse markdown code to show transactions in following format.
handle error handling and default values.
first save data in an array to that we can sort, show total amount etc.
<div class="transaction">
        <div class="transaction-info">
            <div class="transaction-icon">
                <!-- if method = cash or credit -->
                <img src="./img/icons/cash.svg" class="svg-icon"/>
                <img src="./img/icons/credit.svg" class="svg-icon"/>
            </div>
            <div class="transaction-text">
                <div class="title">Category</div>
                <div class="description">description</div>
            </div>
        </div>
        <div class="transaction-details">
            <div class="amount">amount</div>
            <div class="time">account</div>
        </div>
    </div>




@transcations
desc, Category, method, account, method, acount, amount

Desc
    details

Category
    Bills & Utilities
    Rent & EMI
    Food & Dining
    Shopping
    Entertainment
    Travel & Transport
    Health & Fitness
    Education & Learning
    Investments & Savings
    Donations & Charity
    Miscellaneous

Payment Method
    Cash, Credit

Account
    Amazon, or any other

Amount
    amount


