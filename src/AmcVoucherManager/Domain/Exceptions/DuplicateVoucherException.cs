namespace AmcVoucherManager.Domain.Exceptions;

public class DuplicateVoucherException : Exception
{
    public DuplicateVoucherException(string message) : base(message) { }
}
