"""
ROYSTIAN FOUNDATION — Python Development practical task
Programming and OOP problem set

How to use this file
--------------------
1. Fill in the four functions in PART A and the class in PART B.
2. Run:  python problem_set.py
   Each check prints PASS or FAIL. Every check fails until you implement it.
3. Submit this file (or a notebook with the same code) plus a short
   explanation: how you handled errors, and the time complexity of your
   solution to Problem 4.

Rules: standard library only. Do not change the function names or the
checks at the bottom.
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# PART A — practical problems
# ---------------------------------------------------------------------------

def normalise_mobile(raw: str) -> str:
    """Problem 1 — Clean an Indian mobile number from a sign-up form.

    Accept input with spaces, dashes, brackets, a leading 0, '91' or '+91'.
    Return it as '+91' followed by exactly 10 digits. A valid Indian mobile
    starts with 6, 7, 8 or 9.

    Raise ValueError (with a helpful message) for anything else.

    Examples:
        normalise_mobile("98765 43210")       -> "+919876543210"
        normalise_mobile("+91-98765-43210")   -> "+919876543210"
        normalise_mobile("09876543210")       -> "+919876543210"
        normalise_mobile("12345")             -> ValueError
        normalise_mobile("5876543210")        -> ValueError (starts with 5)
    """
    raise NotImplementedError


def split_bill(total_paise: int, people: int) -> list[int]:
    """Problem 2 — Split a restaurant bill fairly, in paise.

    Return a list of `people` amounts that add up to exactly `total_paise`.
    No two amounts may differ by more than 1 paisa; any extra paise go to
    the first people in the list.

    Raise ValueError if people < 1 or total_paise < 0.

    Examples:
        split_bill(100000, 4)  -> [25000, 25000, 25000, 25000]
        split_bill(1000, 3)    -> [334, 333, 333]
        split_bill(1000, 0)    -> ValueError
    """
    raise NotImplementedError


def top_words(text: str, k: int) -> list[tuple[str, int]]:
    """Problem 3 — Most frequent words in customer feedback.

    Lower-case the text, treat anything that is not a letter as a separator,
    ignore words shorter than 3 letters, and return the k most frequent
    words as (word, count) pairs. Sort by count descending, then
    alphabetically for ties. If k <= 0 return [].

    Example:
        top_words("Late delivery. Delivery was LATE again, late!", 2)
            -> [("late", 3), ("delivery", 2)]
    """
    raise NotImplementedError


def merge_bookings(slots: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """Problem 4 — Merge overlapping meeting-room bookings.

    Each slot is (start, end) in minutes since midnight, with start < end.
    Slots arrive unsorted. Merge any that overlap or touch and return the
    result sorted by start time.

    Raise ValueError if any slot has start >= end.

    Examples:
        merge_bookings([(540, 600), (570, 630), (700, 720)])
            -> [(540, 630), (700, 720)]
        merge_bookings([(600, 660), (540, 600)])   -> [(540, 660)]
        merge_bookings([])                          -> []

    In your submission, state the time and space complexity of your solution.
    """
    raise NotImplementedError


# ---------------------------------------------------------------------------
# PART B — object-oriented design task
# ---------------------------------------------------------------------------

class InsufficientBalanceError(Exception):
    """Raised when a wallet payment exceeds the available balance."""


class Wallet:
    """Design a campus canteen wallet.

    Requirements:
      * Created with an owner name and an optional starting balance in paise
        (default 0). A negative starting balance raises ValueError.
      * The balance can be read but not set directly from outside the class
        (encapsulation: expose a read-only `balance` property).
      * top_up(amount_paise): amount must be > 0, otherwise ValueError.
      * pay(amount_paise, note): amount must be > 0 (ValueError), and must not
        exceed the balance (InsufficientBalanceError). The balance never goes
        negative.
      * history(): returns a list of (kind, amount_paise, note) tuples in the
        order they happened, where kind is "top_up" or "pay". Callers must
        not be able to change the wallet by editing the returned list.

    Implement the class, then explain your design choices in the submission.
    """

    def __init__(self, owner: str, balance_paise: int = 0) -> None:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Checks — do not edit below this line
# ---------------------------------------------------------------------------

def _check(name, fn):
    try:
        fn()
        print(f"PASS  {name}")
        return True
    except NotImplementedError:
        print(f"FAIL  {name}  (not implemented yet)")
    except AssertionError as error:
        print(f"FAIL  {name}  {error}")
    except Exception as error:  # noqa: BLE001 — report anything unexpected
        print(f"FAIL  {name}  raised {type(error).__name__}: {error}")
    return False


def _raises(exc, fn, *args):
    try:
        fn(*args)
    except exc:
        return True
    except NotImplementedError:
        raise
    return False


def _p1():
    assert normalise_mobile("98765 43210") == "+919876543210"
    assert normalise_mobile("+91-98765-43210") == "+919876543210"
    assert normalise_mobile("09876543210") == "+919876543210"
    assert normalise_mobile("(91) 7012345678") == "+917012345678"
    assert _raises(ValueError, normalise_mobile, "12345"), "short input should raise"
    assert _raises(ValueError, normalise_mobile, "5876543210"), "must start with 6-9"


def _p2():
    assert split_bill(100000, 4) == [25000] * 4
    assert split_bill(1000, 3) == [334, 333, 333]
    assert sum(split_bill(99999, 7)) == 99999
    assert _raises(ValueError, split_bill, 1000, 0), "zero people should raise"


def _p3():
    assert top_words("Late delivery. Delivery was LATE again, late!", 2) == [("late", 3), ("delivery", 2)]
    assert top_words("bad bad good good ok", 2) == [("bad", 2), ("good", 2)]
    assert top_words("anything", 0) == []


def _p4():
    assert merge_bookings([(540, 600), (570, 630), (700, 720)]) == [(540, 630), (700, 720)]
    assert merge_bookings([(600, 660), (540, 600)]) == [(540, 660)]
    assert merge_bookings([]) == []
    assert _raises(ValueError, merge_bookings, [(600, 600)]), "start >= end should raise"


def _oop():
    wallet = Wallet("Asha", 5000)
    wallet.top_up(2000)
    wallet.pay(3000, "Lunch")
    assert wallet.balance == 4000
    assert _raises(InsufficientBalanceError, wallet.pay, 10000, "Too much")
    assert wallet.balance == 4000, "a failed payment must not change the balance"
    assert _raises(ValueError, wallet.top_up, 0)
    assert _raises(ValueError, Wallet, "Ravi", -1)
    try:
        wallet.balance = 10**9
        raise AssertionError("balance should be read-only")
    except AttributeError:
        pass
    history = wallet.history()
    assert history == [("top_up", 2000, ""), ("pay", 3000, "Lunch")] or [h[:2] for h in history] == [("top_up", 2000), ("pay", 3000)]
    history.clear()
    assert len(wallet.history()) == 2, "editing the returned history must not change the wallet"


if __name__ == "__main__":
    results = [
        _check("Problem 1  normalise_mobile", _p1),
        _check("Problem 2  split_bill", _p2),
        _check("Problem 3  top_words", _p3),
        _check("Problem 4  merge_bookings", _p4),
        _check("Part B     Wallet", _oop),
    ]
    print(f"\n{sum(results)} of {len(results)} checks passing")
